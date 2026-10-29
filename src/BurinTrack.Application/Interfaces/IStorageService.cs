namespace BurinTrack.Application.Interfaces;

public interface IStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task<Stream> DownloadAsync(string objectName, CancellationToken cancellationToken = default);
    Task DeleteAsync(string objectName, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string objectName, CancellationToken cancellationToken = default);
}
