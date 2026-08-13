using Ecommerce.Api.DTOs;

namespace Ecommerce.Api.Models.Results;

public class CartAddResult
{
    public CartAddStatus Status { get; private set; }
    public CartDto? Cart { get; private set; }
    
    public static CartAddResult Success(CartDto cart) => 
        new() { Status = CartAddStatus.Success, Cart = cart };
    
    public static CartAddResult ProductNotFound() =>
        new() { Status = CartAddStatus.ProductNotFound };
    
    public static CartAddResult InsufficientStock() =>
        new() { Status = CartAddStatus.InsufficientStock };
}