using Ecommerce.Api.DTOs;

namespace Ecommerce.Api.Models.Results;

public class CartUpdateResult
{
    public CartUpdateStatus Status { get; private set; }
    public CartDto?  Cart { get; private set; }
    
    public static CartUpdateResult Success(CartDto cart) =>
    new() { Status = CartUpdateStatus.Success, Cart = cart };
    
    public static CartUpdateResult ItemNotFound() =>
    new() { Status = CartUpdateStatus.ItemNotFound};
    
    public static CartUpdateResult InsufficientStock() =>
    new() { Status = CartUpdateStatus.InsufficientStock};
}