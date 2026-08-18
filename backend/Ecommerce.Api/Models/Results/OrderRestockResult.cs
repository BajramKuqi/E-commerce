using Ecommerce.Api.DTOs;

namespace Ecommerce.Api.Models.Results;

public class OrderRestockResult
{
    public OrderRestockStatus Status { get; private set; }
    public OrderDto? Order { get; private set; }

    public static OrderRestockResult Success(OrderDto order) =>
        new() { Status = OrderRestockStatus.Success, Order = order };
    
    public static OrderRestockResult NotFound() =>
    new() { Status =  OrderRestockStatus.NotFound };
    
    public static OrderRestockResult NotRefunded() =>
    new() {Status =  OrderRestockStatus.NotRefunded};
    
    public static OrderRestockResult AlreadyRestocked() =>
    new() { Status =  OrderRestockStatus.AlreadyRestocked };
}