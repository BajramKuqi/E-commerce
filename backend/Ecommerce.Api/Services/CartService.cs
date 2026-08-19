using Ecommerce.Api.Data;
using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models;
using Ecommerce.Api.Models.Results;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Services;

public class CartService : ICartService
{
    private readonly AppDbContext _dbContext;
    
    public CartService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CartDto> GetCartAsync(string userId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        return ToDto(cart);
    }

    public async Task<CartAddResult> AddItemAsync(string userId, AddCartItemDto addCartItem)
    {
        var product = await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == addCartItem.ProductId);
        if (product == null)
            return CartAddResult.ProductNotFound();
        
        var cart = await GetOrCreateCartAsync(userId);
        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == addCartItem.ProductId);
        var requestedQuantity = (existingItem?.Quantity ?? 0) + addCartItem.Quantity;

        if (requestedQuantity > product.StockQuantity)
            return CartAddResult.InsufficientStock();

        if (existingItem != null)
        {
            existingItem.Quantity = requestedQuantity;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = addCartItem.ProductId,
                Quantity = addCartItem.Quantity
            });
        }
        await _dbContext.SaveChangesAsync();
        return CartAddResult.Success(ToDto(cart));
    }

    public async Task<CartUpdateResult> UpdateItemAsync(string userId, int productId, UpdateCartItemDto updateCartItem)
    {
        var cart = await GetOrCreateCartAsync(userId);
        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
            return CartUpdateResult.ItemNotFound();
        
        var product =  await _dbContext.Products.FirstOrDefaultAsync(p => p.Id == productId);
        if (product == null || updateCartItem.Quantity > product.StockQuantity)
            return CartUpdateResult.InsufficientStock();
        
        item.Quantity = updateCartItem.Quantity;
        await _dbContext.SaveChangesAsync();
        return CartUpdateResult.Success(ToDto(cart));
    }

    public async Task<bool> RemoveItemAsync(string userId, int productId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
            return false;
        
        cart.Items.Remove(item);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ClearCartAsync(string userId)
    {
        var cart = await GetOrCreateCartAsync(userId);
        if (cart.Items.Count == 0)
            return false;
        
        cart.Items.Clear();
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private async Task<Cart> GetOrCreateCartAsync(string userId)
    {
        var cart = await  _dbContext.Carts.Include(c => c.Items)
            .ThenInclude(i => i.Product).ThenInclude(p => p.Images)
            .FirstOrDefaultAsync(c => c.UserId == userId);
        
        if (cart != null)
            return cart;
        
        cart = new Cart { UserId = userId };
        _dbContext.Carts.Add(cart);
        await _dbContext.SaveChangesAsync();
        return cart;
    }

    private static CartDto ToDto(Cart cart) => new()
    {
        Id = cart.Id,
        UserId = cart.UserId,
        Items = cart.Items.Select(i => new CartItemDto
        {
            ProductId = i.ProductId,
            ProductName = i.Product.Name,
            ImageUrl = i.Product.Images.FirstOrDefault(img => img.IsPrimary)?.ImageUrl,
            UnitPrice = i.Product.Price,
            Quantity = i.Quantity
        }).ToList()
    };
}