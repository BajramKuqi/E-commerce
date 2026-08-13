using Ecommerce.Api.Models;

namespace Ecommerce.Api.DTOs;

public class OrderDto
{
    public int Id { get; set; }
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDto> Items { get; set; }
}