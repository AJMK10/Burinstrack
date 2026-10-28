using BurinTrack.Domain.Entities;

namespace BurinTrack.Application.Interfaces;

public interface IClientRepository : IRepository<Client>
{
    Task<Client?> GetWithCopieursByIdAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<Client>> SearchAsync(string? search, string? ville, CancellationToken ct = default);
    Task<bool> NumeroContratExisteAsync(string numeroContrat, Guid? excludeId = null, CancellationToken ct = default);
}
