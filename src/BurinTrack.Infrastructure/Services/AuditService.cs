using BurinTrack.Application.Interfaces;
using BurinTrack.Domain.Entities;
using BurinTrack.Infrastructure.Persistence;

namespace BurinTrack.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly BurinTrackDbContext _db;

    public AuditService(BurinTrackDbContext db) => _db = db;

    public async Task LogAsync(string userId, string userName, string action, string entityType,
        string entityId, string? ancienneValeur = null, string? nouvelleValeur = null, string? ip = null)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            UserName = userName,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            AncienneValeur = ancienneValeur,
            NouvelleValeur = nouvelleValeur,
            AdresseIP = ip,
            Timestamp = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();
    }
}
