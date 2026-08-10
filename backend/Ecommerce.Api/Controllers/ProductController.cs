using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models.Results;
using Ecommerce.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ProductController : Controller
{
    private readonly IProductService _productService;
    
    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductDto>>> GetAll([FromQuery] int page = 1,
        [FromQuery] int pageSize = 10, [FromQuery] int? categoryId = null)
    {
        var product = await _productService.GetAllAsync(page, pageSize, categoryId);

        return Ok(product);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetById(int id)
    {
        var product = await _productService.GetByIdAsync(id);
        if (product == null)
            return NotFound();
        
        return Ok(product);
    }

    [HttpPost]
    [Authorize(Roles =  "Admin")]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto createProduct)
    {
        var product = await _productService.CreateAsync(createProduct);
        return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateProductDto updateProduct)
    {
        var product = await _productService.UpdateAsync(id, updateProduct);
        return product.Status switch
        {
            ProductUpdateStatus.NotFound => NotFound(),
            ProductUpdateStatus.ConcurrencyConflict => Conflict("The product was modified by someone else. Refresh and try again."),
            ProductUpdateStatus.Success => Ok(product.Product), 
            _=> StatusCode(500)
        };
    }
    
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var delete = await _productService.DeleteAsync(id);
        if (!delete)
            return NotFound();
        
        return NoContent();
    }
}