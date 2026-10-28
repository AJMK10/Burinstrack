namespace BurinTrack.Application.Interfaces;

public interface IAuditService
{
    Task LogAsync(string userId, string userName, string action, string entityType, string entityId,
        string? ancienneValeur = null, string? nouvelleValeur = null, string? ip = null);
}
