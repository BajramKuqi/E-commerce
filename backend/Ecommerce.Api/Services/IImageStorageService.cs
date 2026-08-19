namespace Ecommerce.Api.Services;

public interface IImageStorageService
{
    Task EnsureBucketExistsAsync();
    Task<string> UploadAsync(IFormFile file);
    Task DeleteAsync(string imageUrl);
}