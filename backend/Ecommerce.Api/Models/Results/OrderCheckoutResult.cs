using Ecommerce.Api.DTOs;

namespace Ecommerce.Api.Models.Results;

public class OrderCheckoutResult
{
    public OrderCheckoutStatus Status { get; private set; }
    public OrderDto? Order { get; private set; }
    public string? ErrorMessage { get; private set; }
    
    public static OrderCheckoutResult Success(OrderDto order) =>
     new() { Status = OrderCheckoutStatus.Success, Order = order };
    
    public static OrderCheckoutResult CartEmpty() =>
    new() { Status = OrderCheckoutStatus.CartEmpty, ErrorMessage = "Cart is empty" };
    
    public static OrderCheckoutResult InsufficientStock(string productName) =>
    new() { Status = OrderCheckoutStatus.InsufficientStock, ErrorMessage = $"Insufficient stock for {productName}"};
    
    public static OrderCheckoutResult ConcurrencyConflict() =>
    new() { Status = OrderCheckoutStatus.ConcurrencyConflict, ErrorMessage = "Stock changed during checkout, please try again"};
}