using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models.Results;

namespace Ecommerce.Api.Services;

public interface IOrderService
{
    Task<OrderCheckoutResult> CheckoutAsync(string userId);
    Task<List<OrderDto>> GetOrderAsync(string userId);
    Task<OrderDto?> GetOrderByIdAsync(string userId,int orderId);
}