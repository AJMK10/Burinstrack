using BurinTrack.Domain.Common;
using BurinTrack.Domain.Enums;

namespace BurinTrack.Domain.Entities;

public class Intervention : BaseEntity
{
    public string NumeroIntervention { get; set; } = string.Empty;
    public DateTime DateIntervention { get; set; }

    public Guid ClientId { get; set; }
    public Guid CopieurId { get; set; }
    public Guid TechnicienId { get; set; }

    // Compteurs
    public long CompteurNBPrecedent { get; set; }
    public long CompteurNBActuel { get; set; }
    public long CompteurCouleurPrecedent { get; set; }
    public long CompteurCouleurActuel { get; set; }

    // Calculés
    public long VolumeNBConsomme => CompteurNBActuel - CompteurNBPrecedent;
    public long VolumeCouleurConsomme => CompteurCouleurActuel - CompteurCouleurPrecedent;

    // Nature et description
    public NatureIntervention Nature { get; set; }
    public string DescriptionProbleme { get; set; } = string.Empty;
    public string ActionsRealisees { get; set; } = string.Empty;
    public string? PiecesRemplacees { get; set; }

    // Temps
    public DateTime? HeureArrivee { get; set; }
    public DateTime? HeureDepart { get; set; }

    // Clôture
    public string? ObservationTechnicien { get; set; }
    public string? ObservationClient { get; set; }
    public StatutIntervention Statut { get; set; } = StatutIntervention.Ouverte;

    // Navigation
    public Client Client { get; set; } = null!;
    public Copieur Copieur { get; set; } = null!;
    public Technicien Technicien { get; set; } = null!;
}
