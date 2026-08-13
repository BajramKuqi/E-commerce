using Ecommerce.Api.Models;

namespace Ecommerce.Api.DTOs;

public class UpdateOrderStatusDto
{
    public OrderStatus NewStatus { get; set; }
}