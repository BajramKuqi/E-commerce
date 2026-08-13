namespace Ecommerce.Api.Models.Results;

public class CategoryDeleteResult
{
    public CategoryDeleteStatus Status { get; private set; }
    
    public static CategoryDeleteResult Success() =>
    new() { Status = CategoryDeleteStatus.Success };
    
    public static CategoryDeleteResult NotFound() =>
        new() { Status = CategoryDeleteStatus.NotFound };
    
    public static CategoryDeleteResult HasProducts() =>
        new() { Status = CategoryDeleteStatus.HasProducts };
}