namespace BurinTrack.Domain.Entities;

public class AuditLog
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? AncienneValeur { get; set; }
    public string? NouvelleValeur { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? AdresseIP { get; set; }
}
