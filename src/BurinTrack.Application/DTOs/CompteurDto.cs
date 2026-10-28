using System.ComponentModel.DataAnnotations;

namespace BurinTrack.Application.DTOs;

public record ReleveCompteurDto(
    Guid Id,
    Guid CopieurId,
    string NomCopieur,
    string NumeroSerie,
    string NomClient,
    int Annee,
    int Mois,
    long A3MonoDebut, long A4MonoDebut, long A3CoulDebut, long A4CoulDebut,
    long A3MonoFin,   long A4MonoFin,   long A3CoulFin,   long A4CoulFin,
    long CopiesMonoA4Eq,
    long CopiesCoulA4Eq,
    DateTime CreatedAt
);

public record CreateReleveDto(
    [Required] Guid CopieurId,
    [Required, Range(2020, 2100)] int Annee,
    [Required, Range(1, 12)] int Mois,
    [Range(0, long.MaxValue)] long A3MonoDebut,
    [Range(0, long.MaxValue)] long A4MonoDebut,
    [Range(0, long.MaxValue)] long A3CoulDebut,
    [Range(0, long.MaxValue)] long A4CoulDebut,
    [Range(0, long.MaxValue)] long A3MonoFin,
    [Range(0, long.MaxValue)] long A4MonoFin,
    [Range(0, long.MaxValue)] long A3CoulFin,
    [Range(0, long.MaxValue)] long A4CoulFin
);

public record UpdateReleveDto(
    [Range(0, long.MaxValue)] long A3MonoDebut,
    [Range(0, long.MaxValue)] long A4MonoDebut,
    [Range(0, long.MaxValue)] long A3CoulDebut,
    [Range(0, long.MaxValue)] long A4CoulDebut,
    [Range(0, long.MaxValue)] long A3MonoFin,
    [Range(0, long.MaxValue)] long A4MonoFin,
    [Range(0, long.MaxValue)] long A3CoulFin,
    [Range(0, long.MaxValue)] long A4CoulFin
);

public record DetailCopieurFactureDto(
    Guid CopieurId,
    string NomCopieur,
    string NumeroSerie,
    long CopiesMonoA4Eq,
    long CopiesCoulA4Eq
);

public record FactureMensuelleDto(
    Guid ClientId,
    string NomClient,
    string NumeroContrat,
    int Annee,
    int Mois,
    long TotalMonoA4Eq,
    long TotalCoulA4Eq,
    long ForfaitCopieMono,
    long ForfaitCopieCouleur,
    long CopiesSupMono,
    long CopiesSupCouleur,
    decimal ForfaitMensuelHT,
    decimal CoutCopiesSupHT,
    decimal TotalHT,
    decimal TauxTVA,
    decimal MontantTVA,
    decimal TotalTTC,
    IEnumerable<DetailCopieurFactureDto> Details
);
