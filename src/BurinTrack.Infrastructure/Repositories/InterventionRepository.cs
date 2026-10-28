using BurinTrack.Application.Interfaces;
using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.Infrastructure.Repositories;

public class InterventionRepository : Repository<Intervention>, IInterventionRepository
{
    public InterventionRepository(BurinTrackDbContext db) : base(db) { }

    public async Task<Intervention?> GetDetailAsync(Guid id, CancellationToken ct = default)
        => await _set
            .Include(i => i.Client)
            .Include(i => i.Copieur)
            .Include(i => i.Technicien)
            .FirstOrDefaultAsync(i => i.Id == id, ct);

    public async Task<IEnumerable<Intervention>> SearchAsync(
        Guid? clientId, Guid? copieurId, Guid? technicienId,
        StatutIntervention? statut, DateTime? du, DateTime? au,
        int page, int taille, CancellationToken ct = default)
    {
        var query = _set.AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.Copieur)
            .Include(i => i.Technicien)
            .AsQueryable();

        if (clientId.HasValue) query = query.Where(i => i.ClientId == clientId);
        if (copieurId.HasValue) query = query.Where(i => i.CopieurId == copieurId);
        if (technicienId.HasValue) query = query.Where(i => i.TechnicienId == technicienId);
        if (statut.HasValue) query = query.Where(i => i.Statut == statut);
        if (du.HasValue) query = query.Where(i => i.DateIntervention >= du);
        if (au.HasValue) query = query.Where(i => i.DateIntervention <= au);

        return await query
            .OrderByDescending(i => i.DateIntervention)
            .Skip((page - 1) * taille)
            .Take(taille)
            .ToListAsync(ct);
    }

    public async Task<string> GenererNumeroInterventionAsync(CancellationToken ct = default)
    {
        var annee = DateTime.UtcNow.Year;
        var mois = DateTime.UtcNow.Month;
        var prefixe = $"INT-{annee}{mois:D2}-";
        var dernierNumero = await _set
            .Where(i => i.NumeroIntervention.StartsWith(prefixe))
            .OrderByDescending(i => i.NumeroIntervention)
            .Select(i => i.NumeroIntervention)
            .FirstOrDefaultAsync(ct);

        var seq = dernierNumero is null ? 1
            : int.Parse(dernierNumero.Split('-').Last()) + 1;

        return $"{prefixe}{seq:D4}";
    }

    public async Task<IEnumerable<Intervention>> GetByTechnicienAsync(
        Guid technicienId, DateTime? du = null, DateTime? au = null, CancellationToken ct = default)
    {
        var query = _set.AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.Copieur)
            .Where(i => i.TechnicienId == technicienId);

        if (du.HasValue) query = query.Where(i => i.DateIntervention >= du);
        if (au.HasValue) query = query.Where(i => i.DateIntervention <= au);

        return await query.OrderByDescending(i => i.DateIntervention).ToListAsync(ct);
    }
}
