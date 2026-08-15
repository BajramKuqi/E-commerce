namespace Ecommerce.Api.Models.Results;

public class OrderRefundResult
{
    public OrderRefundStatus Status { get; set; }
    
    public static OrderRefundResult Success() =>
    new() {Status = OrderRefundStatus.Success};
    
    public static OrderRefundResult NotFound() =>
    new() {Status = OrderRefundStatus.NotFound};
    
    public static OrderRefundResult NotRefundable() =>
    new() {Status = OrderRefundStatus.NotRefundable};
    
    public static OrderRefundResult RefundFailed() =>
    new() {Status = OrderRefundStatus.RefundFailed};
}