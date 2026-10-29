using System.ComponentModel.DataAnnotations;

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
    [Required, StringLength(100)] string Nom,
    [Required, StringLength(100)] string Prenom,
    [Required, StringLength(30)] string Telephone,
    [Required, EmailAddress, StringLength(200)] string Email
);
