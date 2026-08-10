using Ecommerce.Api.Data;
using Ecommerce.Api.DTOs;
using Ecommerce.Api.Models;
using Ecommerce.Api.Models.Results;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Services;

public class ProductService
{
    private readonly AppDbContext _dbContext;
    
    public ProductService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PagedResult<ProductDto>> GetAllAsync(int page, int pageSize, int? categoryId)
    {
        var query = _dbContext.Products.Include(p => p.Category).AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        var totalCount = await query.CountAsync();

        var items = await query.OrderByDescending(p => p.CreatedAt).Skip((page - 1) * pageSize)
            .Take(pageSize).Select(p => ToDto(p)).ToListAsync();

        return new PagedResult<ProductDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        var product = await _dbContext.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return null;
        
        return ToDto(product);
    }

    public async Task<ProductDto?> CreateAsync(CreateProductDto product)
    {
        var newProduct = new Product
        {
            Name = product.Name,
            Description = product.Description,
            Price = product.Price,
            StockQuantity = product.StockQuantity,
            CategoryId = product.CategoryId,
            CreatedAt = DateTime.UtcNow
        };
        
        _dbContext.Products.Add(newProduct);
        await _dbContext.SaveChangesAsync();
        await _dbContext.Entry(newProduct).Reference(p => p.Category).LoadAsync();
        return  ToDto(newProduct);
    }

    public async Task<ProductUpdateResult> UpdateAsync(int id, UpdateProductDto productDto)
    {
        var product = await _dbContext.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null)
            return ProductUpdateResult.NotFound();

        product.Name = productDto.Name;
        product.Description = productDto.Description;
        product.Price = productDto.Price;
        product.StockQuantity = productDto.StockQuantity;
        product.CategoryId = productDto.CategoryId;

        _dbContext.Entry(product).Property(p => p.RowVersion).OriginalValue = productDto.RowVersion;

        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return ProductUpdateResult.ConcurrencyConflict();
        }

        return ProductUpdateResult.Success(ToDto(product));
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var product = await _dbContext.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        
        if (product == null)
            return false;
        
        _dbContext.Products.Remove(product);
        await _dbContext.SaveChangesAsync();
        return true;
    }

    private static ProductDto ToDto(Product product) => new()
    {
        Id = product.Id,
        Name = product.Name,
        Description = product.Description,
        Price = product.Price,
        StockQuantity = product.StockQuantity,
        CategoryId = product.CategoryId,
        CategoryName = product.Category.Name,
        CreatedAt = product.CreatedAt,
        RowVersion = product.RowVersion
    };
}