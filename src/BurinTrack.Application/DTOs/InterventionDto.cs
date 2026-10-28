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
    DateTime DateIntervention,
    Guid ClientId,
    Guid CopieurId,
    Guid TechnicienId,
    long CompteurNBPrecedent,
    long CompteurNBActuel,
    long CompteurCouleurPrecedent,
    long CompteurCouleurActuel,
    NatureIntervention Nature,
    string DescriptionProbleme,
    string ActionsRealisees,
    string? PiecesRemplacees,
    DateTime? HeureArrivee,
    DateTime? HeureDepart,
    string? ObservationTechnicien,
    string? ObservationClient
);

public record UpdateStatutInterventionDto(
    StatutIntervention Statut,
    string? ObservationTechnicien,
    string? ObservationClient
);
