using System.Security.Claims;
using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models;
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
            OrderCheckoutStatus.PaymentSetupFailed => StatusCode(502, result.ErrorMessage),
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

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatusAsync(int id, UpdateOrderStatusDto newStatus)
    {
        var result = await _orderService.UpdateStatusAsync(id, newStatus.NewStatus);
        return result.Status switch
        {
            OrderStatusUpdateStatus.Success => Ok(result.Order),
            OrderStatusUpdateStatus.NotFound => NotFound(),
            OrderStatusUpdateStatus.InvalidTransition => Conflict("Invalid status transition"),
            _ => StatusCode(500)
        };
    }

    [HttpPost("{id:int}/refund")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RefundOrderAsync(int id)
    {
        var result = await _orderService.InitiateRefundAsync(id);
        return result.Status switch
        {
            OrderRefundStatus.Success => Ok("Refund initiated"),
            OrderRefundStatus.NotFound => NotFound(),
            OrderRefundStatus.NotRefundable => Conflict("Order is not eligible for refund"),
            OrderRefundStatus.RefundFailed => StatusCode(502, "Refund failed with payment provider"),
            _ => StatusCode(500),
        };
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> CancelOrderAsync(int id)
    {
        var result = await _orderService.CancelOrderAsync(UserId, id);
        return result.Status switch
        {
            OrderCancelStatus.Success => Ok(result.Order),
            OrderCancelStatus.NotFound => NotFound(),
            OrderCancelStatus.NotCancellable => Conflict("Only pending orders can be cancelled"),
            _ => StatusCode(500)
        };
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllOrdersAsync([FromQuery] AdminOrderQueryDto queryDto)
    {
        var orders = await _orderService.GetAllOrdersAsync(queryDto);
        return Ok(orders);
    }
}