using System.Security.Claims;
using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models.Results;
using Ecommerce.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly ICartService _cartService;
    
    public  CartController(ICartService cartService)
    {
        _cartService = cartService;
    }
    
    private string UserId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<ActionResult<CartDto>> GetCart()
    {
        var cart = await _cartService.GetCartAsync(UserId);
        return Ok(cart);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddCartItemDto cartItem)
    {
        var result = await _cartService.AddItemAsync(UserId,cartItem);
        return result.Status switch
        {
            CartAddStatus.ProductNotFound => NotFound(),
            CartAddStatus.InsufficientStock => Conflict("Not enough stock available"),
            CartAddStatus.Success => Ok(result.Cart),
            _ => StatusCode(500)
        };
    }

    [HttpPut("items/{productId}")]
    public async Task<IActionResult> UpdateItem(int productId, [FromBody] UpdateCartItemDto cartItem)
    {
        var result = await _cartService.UpdateItemAsync(UserId, productId, cartItem);
        return result.Status switch
        {
            CartUpdateStatus.ItemNotFound => NotFound(),
            CartUpdateStatus.InsufficientStock => Conflict("Not enough stock available"),
            CartUpdateStatus.Success => Ok(result.Cart),
            _ => StatusCode(500)
        };
    }

    [HttpDelete("items/{productId}")]
    public async Task<IActionResult> RemoveItem(int productId)
    {
        var removed = await _cartService.RemoveItemAsync(UserId, productId);
        if (!removed)
            return NotFound();

        return NoContent();
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        var cleared = await _cartService.ClearCartAsync(UserId);
        if (!cleared)
            return NotFound();
        
        return NoContent();
    }
}