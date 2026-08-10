using Ecommerce.Api.Data;
using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models;
using Ecommerce.Api.Models.Results;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _dbContext;
    
    public CategoryService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        return await _dbContext.Categories.OrderBy(c => c.Name).Select(c => ToDto(c)).ToListAsync();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var category = await _dbContext.Categories.FindAsync(id);
        
        return category == null ? null : ToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto createCategory)
    {
        var newCategory = new Category
        {
            Name = createCategory.Name,
            Slug = createCategory.Slug,
            Description = createCategory.Description,
        };
        
        _dbContext.Categories.Add(newCategory);
        await _dbContext.SaveChangesAsync();
        return ToDto(newCategory);
    }

    public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto updateCategory)
    {
        var category = await _dbContext.Categories.FindAsync(id);
        if (category == null)
            return null;
        
        category.Name = updateCategory.Name;
        category.Slug = updateCategory.Slug;
        category.Description = updateCategory.Description;
        
        await _dbContext.SaveChangesAsync();
        return ToDto(category);
    }

    public async Task<CategoryDeleteResult> DeleteAsync(int id)
    {
        var  category = await _dbContext.Categories.FindAsync(id);
        if (category == null)
            return CategoryDeleteResult.NotFound();
        
        var hasProducts = await _dbContext.Products.AnyAsync(p => p.CategoryId == category.Id);
        if (hasProducts)
            return CategoryDeleteResult.HasProducts();
        
        _dbContext.Categories.Remove(category);
        await _dbContext.SaveChangesAsync();
        return CategoryDeleteResult.Success();
    }

    private static CategoryDto ToDto(Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Slug = category.Slug,
        Description = category.Description,
    };
}