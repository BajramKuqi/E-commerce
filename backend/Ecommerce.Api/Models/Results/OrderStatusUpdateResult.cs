using Ecommerce.Api.DTOs;

namespace Ecommerce.Api.Models.Results;

public class OrderStatusUpdateResult
{
    public OrderStatusUpdateStatus Status { get; private set; }
    public OrderDto? Order { get; private set; }

    public static OrderStatusUpdateResult Success(OrderDto order) =>
        new() { Status = OrderStatusUpdateStatus.Success, Order = order };

    public static OrderStatusUpdateResult NotFound() =>
        new() { Status = OrderStatusUpdateStatus.NotFound };

    public static OrderStatusUpdateResult InvalidTransition() =>
        new() { Status = OrderStatusUpdateStatus.InvalidTransition };
}