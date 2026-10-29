using System.ComponentModel.DataAnnotations;
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
    [Required] Guid ClientId,
    [Required, StringLength(100)] string Marque,
    [Required, StringLength(100)] string Modele,
    [Required, StringLength(200)] string Designation,
    [Required, StringLength(100)] string NumeroSerie,
    [Required] DateTime DateDebutContrat,
    [Required] DateTime DateFinContrat,
    [StringLength(45)] string? AdresseIP,
    [StringLength(500)] string? Localisation,
    [StringLength(2000)] string? NotesTechniques
);

public record UpdateCopieurDto(
    [Required, StringLength(100)] string Marque,
    [Required, StringLength(100)] string Modele,
    [Required, StringLength(200)] string Designation,
    [Required] DateTime DateDebutContrat,
    [Required] DateTime DateFinContrat,
    [Required] StatutContrat StatutContrat,
    [Required] StatutCopieur Situation,
    [StringLength(45)] string? AdresseIP,
    [StringLength(500)] string? Localisation,
    [StringLength(2000)] string? NotesTechniques
);

public record AttribuerCopieurDto(
    [Required] Guid ClientId,
    [Required] DateTime DateDebutContrat,
    [Required] DateTime DateFinContrat,
    [Required] StatutContrat StatutContrat
);
