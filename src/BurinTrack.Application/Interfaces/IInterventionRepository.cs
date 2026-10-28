using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;

namespace BurinTrack.Application.Interfaces;

public interface IInterventionRepository : IRepository<Intervention>
{
    Task<Intervention?> GetDetailAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<Intervention>> SearchAsync(
        Guid? clientId, Guid? copieurId, Guid? technicienId,
        StatutIntervention? statut, DateTime? du, DateTime? au,
        int page, int taille, CancellationToken ct = default);
    Task<string> GenererNumeroInterventionAsync(CancellationToken ct = default);
    Task<IEnumerable<Intervention>> GetByTechnicienAsync(Guid technicienId, DateTime? du = null, DateTime? au = null, CancellationToken ct = default);
}
