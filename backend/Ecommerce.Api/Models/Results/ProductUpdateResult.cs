using Ecommerce.Api.DTOs;

namespace Ecommerce.Api.Models.Results;

public class ProductUpdateResult
{
    public ProductUpdateStatus Status { get; set; }
    public ProductDto? Product { get; set; }

    public static ProductUpdateResult Success(ProductDto product) =>
        new() { Status = ProductUpdateStatus.Success, Product = product };
    
    public static ProductUpdateResult NotFound() =>
        new() { Status = ProductUpdateStatus.NotFound};
    
    public static ProductUpdateResult ConcurrencyConflict() =>
        new() { Status = ProductUpdateStatus.ConcurrencyConflict};
}