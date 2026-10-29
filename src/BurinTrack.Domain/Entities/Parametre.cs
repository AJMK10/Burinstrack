namespace BurinTrack.Domain.Entities;

public class Parametre
{
    public string Cle { get; set; } = string.Empty;
    public string Valeur { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
