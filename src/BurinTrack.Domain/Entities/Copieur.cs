using BurinTrack.Domain.Common;
using BurinTrack.Domain.Enums;

namespace BurinTrack.Domain.Entities;

public class Copieur : BaseEntity
{
    public Guid ClientId { get; set; }

    // Identification
    public string Marque { get; set; } = string.Empty;
    public string Modele { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string NumeroSerie { get; set; } = string.Empty;

    // Contrat
    public DateTime DateDebutContrat { get; set; }
    public DateTime DateFinContrat { get; set; }
    public StatutContrat StatutContrat { get; set; } = StatutContrat.Actif;

    // Situation
    public StatutCopieur Situation { get; set; } = StatutCopieur.Actif;

    // Informations techniques
    public string? AdresseIP { get; set; }
    public string? Localisation { get; set; }
    public string? NotesTechniques { get; set; }

    // Navigation
    public Client Client { get; set; } = null!;
    public ICollection<Intervention> Interventions { get; set; } = [];
}
