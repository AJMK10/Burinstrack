using BurinTrack.Application.Interfaces;
using BurinTrack.Domain.Entities;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.Infrastructure.Repositories;

public class ClientRepository : Repository<Client>, IClientRepository
{
    public ClientRepository(BurinTrackDbContext db) : base(db) { }

    public async Task<Client?> GetWithCopieursByIdAsync(Guid id, CancellationToken ct = default)
        => await _set
            .Include(c => c.Copieurs)
            .Include(c => c.Documents)
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IEnumerable<Client>> SearchAsync(string? search, string? ville, CancellationToken ct = default)
    {
        var query = _set.AsNoTracking().Include(c => c.Copieurs).Where(c => c.EstActif);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c =>
                c.NomClient.ToLower().Contains(search.ToLower()) ||
                c.NumeroContrat.ToLower().Contains(search.ToLower()) ||
                c.Email.ToLower().Contains(search.ToLower()));

        if (!string.IsNullOrWhiteSpace(ville))
            query = query.Where(c => c.Ville.ToLower() == ville.ToLower());

        return await query.OrderBy(c => c.NomClient).ToListAsync(ct);
    }

    public async Task<bool> NumeroContratExisteAsync(string numeroContrat, Guid? excludeId = null, CancellationToken ct = default)
        => await _set.AnyAsync(c =>
            c.NumeroContrat == numeroContrat && (excludeId == null || c.Id != excludeId), ct);
}
