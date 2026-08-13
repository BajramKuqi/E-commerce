using System.Security.Claims;
using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models.Results;
using Ecommerce.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class OrderController : ControllerBase
{
    private readonly IOrderService _orderService;
    
    public OrderController(IOrderService orderService)
    {
        _orderService = orderService;
    }
    
    
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout()
    {
        var result = await _orderService.CheckoutAsync(UserId);
        return result.Status switch
        {
            OrderCheckoutStatus.Success => Ok(result.Order),
            OrderCheckoutStatus.CartEmpty => BadRequest(result.ErrorMessage),
            OrderCheckoutStatus.InsufficientStock => Conflict(result.ErrorMessage),
            OrderCheckoutStatus.ConcurrencyConflict => Conflict(result.ErrorMessage),
            _ => StatusCode(500)
        };
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders()
    {
        var order = await _orderService.GetOrderAsync(UserId);
        
        return Ok(order);
    }

    [HttpGet("{orderId:int}")]
    public async Task<IActionResult> GetOrderById(int orderId)
    {
        var order = await _orderService.GetOrderByIdAsync(UserId, orderId);
        return order == null ? NotFound() : Ok(order);
    }
}