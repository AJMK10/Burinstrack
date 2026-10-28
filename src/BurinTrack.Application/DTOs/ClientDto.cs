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
    int NombreCopieurs,
    DateTime CreatedAt
);

public record CreateClientDto(
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
    string Email
);

public record UpdateClientDto(
    string NomClient,
    string RaisonSociale,
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
    bool EstActif
);
