using Ecommerce.Api.Data;
using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models;
using Ecommerce.Api.Models.Results;
using Microsoft.EntityFrameworkCore;
using Stripe;

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

        PaymentIntent paymentIntent;
        try
        {
            var paymentIntentService = new PaymentIntentService();
            paymentIntent = await paymentIntentService.CreateAsync(new PaymentIntentCreateOptions
            {
                Amount = (long)(order.TotalAmount * 100),
                Currency = "eur",
                Metadata = new Dictionary<string, string>
                {
                    { "order_id", order.Id.ToString() }
                }
            });
        }
        catch (StripeException)
        {
            return OrderCheckoutResult.PaymentSetupFailed();
        }

        order.StripePaymentIntentId = paymentIntent.Id;
        await  _context.SaveChangesAsync();

        return OrderCheckoutResult.Success(ToDto(order,paymentIntent.ClientSecret));
    }

    public async Task<List<OrderDto>> GetOrderAsync(string userId)
    {
        var orders = await _context.Orders.Include(o => o.Items)
            .Where(o => o.UserId == userId).OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
        
        return orders.Select(o => ToDto(o)).ToList();
    }

    public async Task<OrderDto?> GetOrderByIdAsync(string userId, int orderId)
    {
        var order = await _context.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);
        
        return order == null ? null : ToDto(order);
    }

    private static readonly Dictionary<OrderStatus, OrderStatus[]> ValidTransition = new()
    {
        [OrderStatus.Pending] = new[] { OrderStatus.Paid, OrderStatus.Cancelled },
        [OrderStatus.Paid] = new[] { OrderStatus.Shipped, OrderStatus.Refunded },
        [OrderStatus.Shipped] = new[] { OrderStatus.Delivered, OrderStatus.Refunded },
        [OrderStatus.Delivered] = new[] {OrderStatus.Refunded},
        [OrderStatus.Cancelled] = Array.Empty<OrderStatus>(),
        [OrderStatus.Refunded] = Array.Empty<OrderStatus>()
    };

    public async Task<OrderStatusUpdateResult> UpdateStatusAsync(int orderId, OrderStatus newStatus)
    {
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null)
            return OrderStatusUpdateResult.NotFound();

        if (!ValidTransition[order.Status].Contains(newStatus))
            return OrderStatusUpdateResult.InvalidTransition();

        if (newStatus == OrderStatus.Cancelled)
        {
            await ReleaseStockAsync(order);
        }
        
        order.Status = newStatus;
        await _context.SaveChangesAsync();
        
        return OrderStatusUpdateResult.Success(ToDto(order));
    }

    public async Task<OrderCancelResult> CancelOrderAsync(string userId, int orderId)
    {
        var order = await _context.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

        if (order == null)
            return OrderCancelResult.NotFound();

        if (order.Status != OrderStatus.Pending)
            return OrderCancelResult.NotCancellable();
        
        await ReleaseStockAsync(order);
        order.Status = OrderStatus.Cancelled;
        await _context.SaveChangesAsync();
        
        return OrderCancelResult.Success(ToDto(order));
    }

    private async Task ReleaseStockAsync(Order order)
    {
        var productId = order.Items.Select(i => i.ProductId).ToList();
        var products = await _context.Products.Where(p => productId.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        foreach (var item in order.Items)
        {
            if(products.TryGetValue(item.ProductId, out var product))
                product.StockQuantity += item.Quantity;
        }
        
        var reservations = await _context.InventoryReservations.Where(r => r.OrderId == order.Id).ToListAsync();
        
        _context.InventoryReservations.RemoveRange(reservations);
    }

    public async Task<PagedResult<AdminOrderDto>> GetAllOrdersAsync(AdminOrderQueryDto queryDto)
    {
        
        var page = queryDto.Page < 1 ? 1 : queryDto.Page;
        var pageSize = queryDto.PageSize < 1 ? 20 : Math.Min(queryDto.PageSize, 100);
        
        var orderQuery =_context.Orders.Include(o => o.Items).Include(o => o.User).AsQueryable();
        
        if(queryDto.Status.HasValue)
            orderQuery = orderQuery.Where(o =>o.Status == queryDto.Status.Value);
        
        if(!string.IsNullOrWhiteSpace(queryDto.UserId))
            orderQuery = orderQuery.Where(o => o.UserId == queryDto.UserId);
        
        if(!string.IsNullOrWhiteSpace(queryDto.Email))
            orderQuery = orderQuery.Where(o => o.User.Email != null && o.User.Email.Contains(queryDto.Email));
        
        var totalCount = await orderQuery.CountAsync();

        var orders = await orderQuery.OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize).ToListAsync();

        return new PagedResult<AdminOrderDto>
        {
            Items = orders.Select(ToAdminDto).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
        };
    }

    public async Task<OrderStatusUpdateResult> MarkOrderPaidByPaymentIntentAsync(string paymentIntentId)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.StripePaymentIntentId == paymentIntentId);
        if (order == null)
            return OrderStatusUpdateResult.NotFound();

        return await UpdateStatusAsync(order.Id, OrderStatus.Paid);
    }

    public async Task<OrderRefundResult> InitiateRefundAsync(int orderId)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId);
        if (order == null)
            return OrderRefundResult.NotFound();
        
        var refundableStatus = new[] {OrderStatus.Paid, OrderStatus.Shipped, OrderStatus.Delivered};
        if (!refundableStatus.Contains(order.Status) || string.IsNullOrEmpty(order.StripePaymentIntentId))
            return OrderRefundResult.NotRefundable();

        try
        {
            var refundService = new RefundService();
            await refundService.CreateAsync(new RefundCreateOptions
            {
                PaymentIntent = order.StripePaymentIntentId
            });
        }
        catch (StripeException)
        {
            return OrderRefundResult.RefundFailed();
        }

        return OrderRefundResult.Success();
    }

    public async Task<OrderStatusUpdateResult> MarkOrderRefundedByPaymentIntentAsync(string paymentIntentId)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.StripePaymentIntentId == paymentIntentId);
        if (order == null)
            return OrderStatusUpdateResult.NotFound();
        
        return await UpdateStatusAsync(order.Id, OrderStatus.Refunded);
    }

    private OrderDto ToDto(Order order,string? clientSecret = null) => new()
    {
        Id = order.Id,
        Status = order.Status,
        TotalAmount = order.TotalAmount,
        CreatedAt = order.CreatedAt,
        ClientSecret = clientSecret,
        Items = order.Items.Select(i => new OrderItemDto
        {
            ProductId = i.ProductId,
            ProductName = i.ProductNameSnapshot,
            UnitPrice = i.UnitPriceSnapshot,
            Quantity = i.Quantity
        }).ToList()
    };

    private static AdminOrderDto ToAdminDto(Order order) => new()
    {
        Id = order.Id,
        UserId = order.UserId,
        UserFullName =  order.User.FullName,
        UserEmail = order.User.Email ?? "(no email)",
        Status = order.Status,
        TotalPrice = order.TotalAmount,
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