using Ecommerce.Api.Data;
using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models;
using Ecommerce.Api.Models.Results;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Services;

public class OrderService : IOrderService
{
    private const int ReservationMinutes = 30;
    private readonly AppDbContext _context;
    
    public OrderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<OrderCheckoutResult> CheckoutAsync(string userId)
    {
        var cart = await _context.Carts.Include(c => c.Items)
            .ThenInclude(i => i.Product).FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null || cart.Items.Count == 0)
            return OrderCheckoutResult.CartEmpty();

        var order = new Order
        {
            UserId = userId,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow,
        };

        var expiresAt = DateTime.UtcNow.AddMinutes(ReservationMinutes);
        decimal total = 0;

        foreach (var cartItem in cart.Items)
        {
            var product = cartItem.Product;

            if (cartItem.Quantity > product.StockQuantity)
                return OrderCheckoutResult.InsufficientStock(product.Name);
            
            product.StockQuantity -= cartItem.Quantity;
            
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductNameSnapshot = product.Name,
                UnitPriceSnapshot =  product.Price,
                Quantity = cartItem.Quantity,
            });

            _context.InventoryReservations.Add(new InventoryReservation
            {
                ProductId = product.Id,
                Quantity = cartItem.Quantity,
                ExpiresAt = expiresAt,
                Order = order
            });
            
            total += product.Price * cartItem.Quantity;
        }

        order.TotalAmount = total;
        _context.Orders.Add(order);
        cart.Items.Clear();

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return OrderCheckoutResult.ConcurrencyConflict();
        }

        return OrderCheckoutResult.Success(ToDto(order));
    }

    public async Task<List<OrderDto>> GetOrderAsync(string userId)
    {
        var orders = await _context.Orders.Include(o => o.Items)
            .Where(o => o.UserId == userId).OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        
        return orders.Select(ToDto).ToList();
    }

    public async Task<OrderDto?> GetOrderByIdAsync(string userId, int orderId)
    {
        var order = await _context.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);
        
        return order == null ? null : ToDto(order);
    }

    private OrderDto ToDto(Order order) => new()
    {
        Id = order.Id,
        Status = order.Status,
        TotalAmount = order.TotalAmount,
        CreatedAt = order.CreatedAt,
        Items = order.Items.Select(i => new OrderItemDto
        {
            ProductId = i.ProductId,
            ProductName = i.ProductNameSnapshot,
            UnitPrice = i.UnitPriceSnapshot,
            Quantity = i.Quantity
        }).ToList()
    };
}