using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models.Results;

namespace Ecommerce.Api.Services;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync();
    Task<CategoryDto?> GetByIdAsync(int id);
    Task<CategoryDto> CreateAsync(CreateCategoryDto createCategory);
    Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto updateCategory);
    Task<CategoryDeleteResult> DeleteAsync(int id);
}