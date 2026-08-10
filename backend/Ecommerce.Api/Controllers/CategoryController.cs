using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models.Results;
using Ecommerce.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class CategoryController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    
    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryDto>>> GetAll()
    {
        var categories = await _categoryService.GetAllAsync();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetById(int id)
    {
        var category = await _categoryService.GetByIdAsync(id);

        if (category == null)
            return NotFound();
        
        return Ok(category);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto createCategory)
    {
        var category = await _categoryService.CreateAsync(createCategory);
        
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto updateCategory)
    {
        var category = await _categoryService.UpdateAsync(id, updateCategory);
        if(category == null)
            return NotFound();
        
        return Ok(category);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var  category = await _categoryService.DeleteAsync(id);
        return category.Status switch
        {
            CategoryDeleteStatus.NotFound => NotFound(),
            CategoryDeleteStatus.HasProducts => Conflict(
                "Cannot delete a category that still has products assigned to it"),
            CategoryDeleteStatus.Success => NoContent(),
            _ => StatusCode(500)
        };
    }
}