using BurinTrack.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Minio;
using Minio.DataModel.Args;

namespace BurinTrack.Infrastructure.Services;

public class MinioStorageService : IStorageService
{
    private readonly IMinioClient _client;
    private readonly string _bucketName;

    public MinioStorageService(IMinioClient client, IConfiguration config)
    {
        _client = client;
        _bucketName = config["MinIO:BucketName"] ?? "burintrack";
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        await EnsureBucketExistsAsync(cancellationToken);

        var objectName = $"{Guid.NewGuid():N}_{fileName}";
        var args = new PutObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithStreamData(fileStream)
            .WithObjectSize(fileStream.Length)
            .WithContentType(contentType);

        await _client.PutObjectAsync(args, cancellationToken);
        return objectName;
    }

    public async Task<Stream> DownloadAsync(string objectName, CancellationToken cancellationToken = default)
    {
        var memStream = new MemoryStream();
        var args = new GetObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName)
            .WithCallbackStream(stream => stream.CopyTo(memStream));

        await _client.GetObjectAsync(args, cancellationToken);
        memStream.Position = 0;
        return memStream;
    }

    public async Task DeleteAsync(string objectName, CancellationToken cancellationToken = default)
    {
        var args = new RemoveObjectArgs()
            .WithBucket(_bucketName)
            .WithObject(objectName);

        await _client.RemoveObjectAsync(args, cancellationToken);
    }

    public async Task<bool> ExistsAsync(string objectName, CancellationToken cancellationToken = default)
    {
        try
        {
            var args = new StatObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(objectName);

            await _client.StatObjectAsync(args, cancellationToken);
            return true;
        }
        catch (Minio.Exceptions.ObjectNotFoundException)
        {
            return false;
        }
    }

    private async Task EnsureBucketExistsAsync(CancellationToken cancellationToken)
    {
        var existsArgs = new BucketExistsArgs().WithBucket(_bucketName);
        var exists = await _client.BucketExistsAsync(existsArgs, cancellationToken);
        if (!exists)
        {
            var makeArgs = new MakeBucketArgs().WithBucket(_bucketName);
            await _client.MakeBucketAsync(makeArgs, cancellationToken);
        }
    }
}
