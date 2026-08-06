namespace Ecommerce.Api.Models;

public class InventoryReservation
{
    public int Id { get; set; }
    
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    public int Quantity { get; set; }
    public DateTime ExpiresAt { get; set; }
    
    public int? OrderId { get; set; }
    public Order? Order { get; set; }
}