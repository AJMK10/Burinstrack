using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;

namespace BurinTrack.Application.Interfaces;

public interface ICopieurRepository : IRepository<Copieur>
{
    Task<Copieur?> GetWithInterventionsByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<Copieur>> GetByClientIdAsync(Guid clientId, CancellationToken ct = default);
    Task<IEnumerable<Copieur>> GetContratsExpirantDansAsync(int jours, CancellationToken ct = default);
    Task<bool> NumeroSerieExisteAsync(string numeroSerie, Guid? excludeId = null, CancellationToken ct = default);
}
