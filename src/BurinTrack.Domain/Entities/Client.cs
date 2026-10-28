using BurinTrack.Domain.Common;

namespace BurinTrack.Domain.Entities;

public class Client : BaseEntity
{
    public string NomClient { get; set; } = string.Empty;
    public string RaisonSociale { get; set; } = string.Empty;
    public string NumeroContrat { get; set; } = string.Empty;
    public string SecteurActivite { get; set; } = string.Empty;

    // Localisation
    public string Adresse { get; set; } = string.Empty;
    public string Ville { get; set; } = string.Empty;
    public string Commune { get; set; } = string.Empty;
    public string Pays { get; set; } = "Gabon";
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Contact principal
    public string NomContact { get; set; } = string.Empty;
    public string FonctionContact { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    public bool EstActif { get; set; } = true;

    // Navigation
    public ICollection<Copieur> Copieurs { get; set; } = [];
    public ICollection<Document> Documents { get; set; } = [];
}
