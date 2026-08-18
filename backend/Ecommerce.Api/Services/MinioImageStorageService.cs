using Minio;
using Minio.DataModel.Args;

namespace Ecommerce.Api.Services;

public class MinioImageStorageService : IImageStorageService
{
    private const string BucketName = "product-images";
    private readonly IMinioClient _minioClient;

    public MinioImageStorageService(IMinioClient minioClient)
    {
        _minioClient = minioClient;
    }

    public async Task EnsureBucketExistsAsync()
    {
         var exists = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(BucketName));
         if (!exists)
         {
             await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(BucketName));
         }
         
         var policy = $$"""
                        {
                            "Version": "2012-10-17",
                            "Statement": [
                                {
                                    "Effect": "Allow",
                                    "Principal": "*",
                                    "Action": ["s3:GetObject"],
                                    "Resource": ["arn:aws:s3:::{{BucketName}}/*"]
                                }
                            ]
                        }
                        """;

         await _minioClient.SetPolicyAsync(new SetPolicyArgs().WithBucket(BucketName).WithPolicy(policy));
    }

    public async Task<string> UploadAsync(IFormFile file)
    {
        var objectName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        await using var stream = file.OpenReadStream();
        await _minioClient.PutObjectAsync(new PutObjectArgs()
            .WithBucket(BucketName)
            .WithObject(objectName)
            .WithStreamData(stream)
            .WithObjectSize(file.Length)
            .WithContentType(file.ContentType));
        
        return $"http://localhost:9000/{BucketName}/{objectName}";
    }
}