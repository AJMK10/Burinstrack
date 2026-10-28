using BurinTrack.Domain.Enums;

namespace BurinTrack.Application.DTOs;

public record CopieurDto(
    Guid Id,
    Guid ClientId,
    string NomClient,
    string Marque,
    string Modele,
    string Designation,
    string NumeroSerie,
    DateTime DateDebutContrat,
    DateTime DateFinContrat,
    StatutContrat StatutContrat,
    StatutCopieur Situation,
    string? AdresseIP,
    string? Localisation,
    string? NotesTechniques,
    int JoursAvantExpiration,
    DateTime CreatedAt
);

public record CreateCopieurDto(
    Guid ClientId,
    string Marque,
    string Modele,
    string Designation,
    string NumeroSerie,
    DateTime DateDebutContrat,
    DateTime DateFinContrat,
    string? AdresseIP,
    string? Localisation,
    string? NotesTechniques
);

public record UpdateCopieurDto(
    string Marque,
    string Modele,
    string Designation,
    DateTime DateDebutContrat,
    DateTime DateFinContrat,
    StatutContrat StatutContrat,
    StatutCopieur Situation,
    string? AdresseIP,
    string? Localisation,
    string? NotesTechniques
);
