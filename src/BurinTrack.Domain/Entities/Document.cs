using BurinTrack.Domain.Common;

namespace BurinTrack.Domain.Entities;

public class Document : BaseEntity
{
    public Guid ClientId { get; set; }
    public string NomFichier { get; set; } = string.Empty;
    public string TypeDocument { get; set; } = string.Empty;
    public string CheminStockage { get; set; } = string.Empty;
    public long TailleFichier { get; set; }
    public string UploadePar { get; set; } = string.Empty;

    // Navigation
    public Client Client { get; set; } = null!;
}
