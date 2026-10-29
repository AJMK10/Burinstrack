using System.ComponentModel.DataAnnotations;
using BurinTrack.Domain.Enums;

namespace BurinTrack.Application.DTOs;

public record InterventionDto(
    Guid Id,
    string NumeroIntervention,
    DateTime DateIntervention,
    Guid ClientId,
    string NomClient,
    Guid CopieurId,
    string DesignationCopieur,
    string NumeroSerie,
    Guid TechnicienId,
    string NomTechnicien,
    long CompteurNBPrecedent,
    long CompteurNBActuel,
    long CompteurCouleurPrecedent,
    long CompteurCouleurActuel,
    long VolumeNBConsomme,
    long VolumeCouleurConsomme,
    NatureIntervention Nature,
    string DescriptionProbleme,
    string ActionsRealisees,
    string? PiecesRemplacees,
    DateTime? HeureArrivee,
    DateTime? HeureDepart,
    string? ObservationTechnicien,
    string? ObservationClient,
    StatutIntervention Statut,
    DateTime CreatedAt
);

public record CreateInterventionDto(
    [Required] DateTime DateIntervention,
    [Required] Guid ClientId,
    [Required] Guid CopieurId,
    [Required] Guid TechnicienId,
    [Range(0, long.MaxValue)] long CompteurNBPrecedent,
    [Range(0, long.MaxValue)] long CompteurNBActuel,
    [Range(0, long.MaxValue)] long CompteurCouleurPrecedent,
    [Range(0, long.MaxValue)] long CompteurCouleurActuel,
    [Required] NatureIntervention Nature,
    [Required, StringLength(2000, MinimumLength = 10)] string DescriptionProbleme,
    [Required, StringLength(2000, MinimumLength = 5)] string ActionsRealisees,
    [StringLength(1000)] string? PiecesRemplacees,
    DateTime? HeureArrivee,
    DateTime? HeureDepart,
    [StringLength(1000)] string? ObservationTechnicien,
    [StringLength(1000)] string? ObservationClient
);

public record UpdateStatutInterventionDto(
    [Required] StatutIntervention Statut,
    [StringLength(1000)] string? ObservationTechnicien,
    [StringLength(1000)] string? ObservationClient
);
