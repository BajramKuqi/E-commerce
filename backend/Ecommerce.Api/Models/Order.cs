namespace Ecommerce.Api.Models;

public class Order
{
    public int Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? StripePaymentIntentId { get; set; }
    public bool IsRestocked { get; set; } = false;
    
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}