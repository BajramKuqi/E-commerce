using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models.Results;

namespace Ecommerce.Api.Services;

public interface ICartService
{
    Task<CartDto> GetCartAsync(string userId);
    Task<CartAddResult> AddItemAsync(string userId, AddCartItemDto addCartItem);
    Task<CartUpdateResult> UpdateItemAsync(string userId, int productId, UpdateCartItemDto updateCartItem);
    Task<bool> RemoveItemAsync(string userId, int productId);
    Task<bool> ClearCartAsync(string userId);
}