using Ecommerce.Api.Models;

namespace Ecommerce.Api.DTOs;

public class AdminOrderDto
{
    public int Id { get; set; }
    public string UserId { get; set; } =  null!;
    public OrderStatus Status { get; set; }
    public decimal TotalPrice { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();

}