using Ecommerce.Api.Models;

namespace Ecommerce.Api.DTOs;

public class AdminOrderQueryDto
{
    public OrderStatus? Status { get; set; }
    public string? UserId { get; set; }
    public string? Email { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}