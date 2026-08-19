using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models.Results;

namespace Ecommerce.Api.Services;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetAllAsync(int page, int pageSize, int? categoryId);
    Task<ProductDto?> GetByIdAsync(int id);
    Task<ProductDto> CreateAsync(CreateProductDto createProduct);
    Task<ProductUpdateResult> UpdateAsync(int id, UpdateProductDto updateProduct);
    Task<bool> DeleteAsync(int id);
    Task<ProductDto?> AddImageAsync(int productId, IFormFile file, IImageStorageService storage);
    Task<ProductDto?> DeleteImageAsync(int productId, int imageId,IImageStorageService storage);
}