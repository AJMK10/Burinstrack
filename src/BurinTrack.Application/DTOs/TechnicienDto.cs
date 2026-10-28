namespace BurinTrack.Application.DTOs;

public record TechnicienDto(
    Guid Id,
    string Nom,
    string Prenom,
    string NomComplet,
    string Telephone,
    string Email,
    bool EstActif,
    int TotalInterventions,
    int InterventionsEnCours,
    DateTime CreatedAt
);

public record CreateTechnicienDto(
    string Nom,
    string Prenom,
    string Telephone,
    string Email
);
