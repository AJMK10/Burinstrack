using System.ComponentModel.DataAnnotations;

namespace BurinTrack.Application.DTOs;

public record ClientDto(
    Guid Id,
    string NomClient,
    string RaisonSociale,
    string NumeroContrat,
    string SecteurActivite,
    string Adresse,
    string Ville,
    string Commune,
    string Pays,
    double? Latitude,
    double? Longitude,
    string NomContact,
    string FonctionContact,
    string Telephone,
    string Email,
    bool EstActif,
    decimal ForfaitMensuelHT,
    long ForfaitCopieMono,
    long ForfaitCopieCouleur,
    decimal PrixCopieSupMono,
    decimal PrixCopieSupCouleur,
    decimal TauxTVA,
    int NombreCopieurs,
    DateTime CreatedAt
);

public record CreateClientDto(
    [Required, StringLength(200)] string NomClient,
    [Required, StringLength(200)] string RaisonSociale,
    [Required, StringLength(50)] string NumeroContrat,
    [Required, StringLength(100)] string SecteurActivite,
    [Required, StringLength(500)] string Adresse,
    [Required, StringLength(100)] string Ville,
    [Required, StringLength(100)] string Commune,
    [Required, StringLength(100)] string Pays,
    [Range(-90, 90)] double? Latitude,
    [Range(-180, 180)] double? Longitude,
    [Required, StringLength(200)] string NomContact,
    [StringLength(200)] string FonctionContact,
    [Required, Phone, StringLength(30)] string Telephone,
    [Required, EmailAddress, StringLength(200)] string Email,
    [Range(0, double.MaxValue)] decimal ForfaitMensuelHT = 920000,
    [Range(0, long.MaxValue)] long ForfaitCopieMono = 52000,
    [Range(0, long.MaxValue)] long ForfaitCopieCouleur = 8000,
    [Range(0, double.MaxValue)] decimal PrixCopieSupMono = 10,
    [Range(0, double.MaxValue)] decimal PrixCopieSupCouleur = 50,
    [Range(0, 100)] decimal TauxTVA = 18
);

public record UpdateClientDto(
    [Required, StringLength(200)] string NomClient,
    [Required, StringLength(200)] string RaisonSociale,
    [Required, StringLength(100)] string SecteurActivite,
    [Required, StringLength(500)] string Adresse,
    [Required, StringLength(100)] string Ville,
    [Required, StringLength(100)] string Commune,
    [Required, StringLength(100)] string Pays,
    [Range(-90, 90)] double? Latitude,
    [Range(-180, 180)] double? Longitude,
    [Required, StringLength(200)] string NomContact,
    [StringLength(200)] string FonctionContact,
    [Required, Phone, StringLength(30)] string Telephone,
    [Required, EmailAddress, StringLength(200)] string Email,
    bool EstActif,
    [Range(0, double.MaxValue)] decimal ForfaitMensuelHT = 920000,
    [Range(0, long.MaxValue)] long ForfaitCopieMono = 52000,
    [Range(0, long.MaxValue)] long ForfaitCopieCouleur = 8000,
    [Range(0, double.MaxValue)] decimal PrixCopieSupMono = 10,
    [Range(0, double.MaxValue)] decimal PrixCopieSupCouleur = 50,
    [Range(0, 100)] decimal TauxTVA = 18
);
