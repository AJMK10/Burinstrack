namespace BurinTrack.Application.DTOs;

public record DashboardDto(
    int TotalClients,
    int TotalCopieurs,
    int ContratsActifs,
    int InterventionsOuvertes,
    int InterventionsEnCours,
    int InterventionsResolues,
    int InterventionsFermees,
    int TotalTechniciens,
    int ContratsExpirant30,
    int ContratsExpirant60,
    IEnumerable<InterventionsParTechnicienDto> InterventionsParTechnicien,
    IEnumerable<CopieurExpirationDto> ContratsExpirantBientot,
    IEnumerable<InterventionsParMoisDto> InterventionsParMois,
    IEnumerable<RepartitionDto> InterventionsParNature,
    IEnumerable<PanneRecurrenteDto> PannesRecurrentes,
    VolumeDto VolumesTotaux
);

public record InterventionsParTechnicienDto(
    string NomTechnicien,
    int NombreInterventions,
    int InterventionsResolues
);

public record CopieurExpirationDto(
    Guid CopieurId,
    string Designation,
    string NumeroSerie,
    string NomClient,
    DateTime DateFinContrat,
    int JoursRestants
);

public record InterventionsParMoisDto(
    string Mois,
    string Libelle,
    int Total,
    int Pannes
);

public record RepartitionDto(
    string Cle,
    int Valeur
);

public record PanneRecurrenteDto(
    Guid CopieurId,
    string Designation,
    string NumeroSerie,
    string NomClient,
    int NombrePannes
);

public record VolumeDto(
    long TotalNB,
    long TotalCouleur,
    IEnumerable<VolumeParClientDto> ParClient
);

public record VolumeParClientDto(
    string NomClient,
    long VolumeNB,
    long VolumeCouleur
);
