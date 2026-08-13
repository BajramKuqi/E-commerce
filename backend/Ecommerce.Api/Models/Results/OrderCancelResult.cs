using Ecommerce.Api.DTOs;

namespace Ecommerce.Api.Models.Results;

public class OrderCancelResult
{
    public OrderCancelStatus Status { get; set; }
    public OrderDto? Order { get; set; }
    
    public static OrderCancelResult Success(OrderDto order) =>
        new() { Status = OrderCancelStatus.Success, Order = order };
    
    public static OrderCancelResult NotFound() =>
        new() { Status = OrderCancelStatus.NotFound};
    
    public static OrderCancelResult NotCancellable() =>
        new() { Status = OrderCancelStatus.NotCancellable };
}