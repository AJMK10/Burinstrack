using BurinTrack.Application.Interfaces;
using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.Infrastructure.Repositories;

public class CopieurRepository : Repository<Copieur>, ICopieurRepository
{
    public CopieurRepository(BurinTrackDbContext db) : base(db) { }

    public async Task<Copieur?> GetWithInterventionsByIdAsync(Guid id, CancellationToken ct = default)
        => await _set
            .Include(c => c.Client)
            .Include(c => c.Interventions.OrderByDescending(i => i.DateIntervention).Take(10))
            .FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task<IEnumerable<Copieur>> GetByClientIdAsync(Guid clientId, CancellationToken ct = default)
        => await _set
            .AsNoTracking()
            .Include(c => c.Client)
            .Where(c => c.ClientId == clientId)
            .OrderBy(c => c.Designation)
            .ToListAsync(ct);

    public async Task<IEnumerable<Copieur>> GetContratsExpirantDansAsync(int jours, CancellationToken ct = default)
    {
        var limite = DateTime.UtcNow.AddDays(jours);
        return await _set
            .AsNoTracking()
            .Include(c => c.Client)
            .Where(c => c.StatutContrat == StatutContrat.Actif && c.DateFinContrat <= limite)
            .OrderBy(c => c.DateFinContrat)
            .ToListAsync(ct);
    }

    public async Task<bool> NumeroSerieExisteAsync(string numeroSerie, Guid? excludeId = null, CancellationToken ct = default)
        => await _set.AnyAsync(c =>
            c.NumeroSerie == numeroSerie && (excludeId == null || c.Id != excludeId), ct);
}
