using BurinTrack.Application.DTOs;
using BurinTrack.Domain.Entities;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/compteurs")]
[Authorize(Policy = "CanViewAll")]
public class CompteursController : ControllerBase
{
    private readonly BurinTrackDbContext _db;
    public CompteursController(BurinTrackDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ReleveCompteurDto>>> GetAll(
        [FromQuery] Guid? copieurId,
        [FromQuery] Guid? clientId,
        [FromQuery] int? annee,
        [FromQuery] int? mois,
        CancellationToken ct)
    {
        var q = _db.Releves.AsNoTracking()
            .Include(r => r.Copieur).ThenInclude(c => c.Client)
            .AsQueryable();
        if (copieurId.HasValue) q = q.Where(r => r.CopieurId == copieurId);
        if (clientId.HasValue)  q = q.Where(r => r.Copieur.ClientId == clientId);
        if (annee.HasValue)     q = q.Where(r => r.Annee == annee);
        if (mois.HasValue)      q = q.Where(r => r.Mois == mois);
        var list = await q.OrderByDescending(r => r.Annee).ThenByDescending(r => r.Mois).ToListAsync(ct);
        return Ok(list.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReleveCompteurDto>> GetById(Guid id, CancellationToken ct)
    {
        var r = await _db.Releves.AsNoTracking()
            .Include(r => r.Copieur).ThenInclude(c => c.Client)
            .FirstOrDefaultAsync(r => r.Id == id, ct);
        return r is null ? NotFound() : Ok(MapToDto(r));
    }

    [HttpPost]
    [Authorize(Policy = "CanManageClients")]
    public async Task<ActionResult<ReleveCompteurDto>> Create([FromBody] CreateReleveDto dto, CancellationToken ct)
    {
        if (!await _db.Copieurs.AnyAsync(c => c.Id == dto.CopieurId, ct))
            return BadRequest("Copieur introuvable.");
        if (await _db.Releves.AnyAsync(r => r.CopieurId == dto.CopieurId && r.Annee == dto.Annee && r.Mois == dto.Mois, ct))
            return Conflict("Un relevé existe déjà pour ce copieur sur cette période.");

        var releve = new ReleveCompteur
        {
            CopieurId    = dto.CopieurId,
            Annee        = dto.Annee,
            Mois         = dto.Mois,
            A3MonoDebut  = dto.A3MonoDebut,
            A4MonoDebut  = dto.A4MonoDebut,
            A3CoulDebut  = dto.A3CoulDebut,
            A4CoulDebut  = dto.A4CoulDebut,
            A3MonoFin    = dto.A3MonoFin,
            A4MonoFin    = dto.A4MonoFin,
            A3CoulFin    = dto.A3CoulFin,
            A4CoulFin    = dto.A4CoulFin,
        };
        _db.Releves.Add(releve);
        await _db.SaveChangesAsync(ct);
        await _db.Entry(releve).Reference(r => r.Copieur).LoadAsync(ct);
        await _db.Entry(releve.Copieur).Reference(c => c.Client).LoadAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = releve.Id }, MapToDto(releve));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CanManageClients")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateReleveDto dto, CancellationToken ct)
    {
        var releve = await _db.Releves.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (releve is null) return NotFound();
        releve.A3MonoDebut = dto.A3MonoDebut;
        releve.A4MonoDebut = dto.A4MonoDebut;
        releve.A3CoulDebut = dto.A3CoulDebut;
        releve.A4CoulDebut = dto.A4CoulDebut;
        releve.A3MonoFin   = dto.A3MonoFin;
        releve.A4MonoFin   = dto.A4MonoFin;
        releve.A3CoulFin   = dto.A3CoulFin;
        releve.A4CoulFin   = dto.A4CoulFin;
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "CanManageClients")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var releve = await _db.Releves.FirstOrDefaultAsync(r => r.Id == id, ct);
        if (releve is null) return NotFound();
        _db.Releves.Remove(releve);
        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpGet("facture/{clientId:guid}/{annee:int}/{mois:int}")]
    public async Task<ActionResult<FactureMensuelleDto>> GetFacture(
        Guid clientId, int annee, int mois, CancellationToken ct)
    {
        var client = await _db.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == clientId, ct);
        if (client is null) return NotFound("Client introuvable.");

        var releves = await _db.Releves.AsNoTracking()
            .Include(r => r.Copieur)
            .Where(r => r.Copieur.ClientId == clientId && r.Annee == annee && r.Mois == mois)
            .ToListAsync(ct);

        var details = releves.Select(r => new DetailCopieurFactureDto(
            r.CopieurId,
            r.Copieur.Designation,
            r.Copieur.NumeroSerie,
            r.CopiesMonoA4Eq,
            r.CopiesCoulA4Eq
        )).ToList();

        long totalMono     = details.Sum(d => d.CopiesMonoA4Eq);
        long totalCoul     = details.Sum(d => d.CopiesCoulA4Eq);
        long copiesSupMono = Math.Max(0, totalMono - client.ForfaitCopieMono);
        long copiesSupCoul = Math.Max(0, totalCoul - client.ForfaitCopieCouleur);

        decimal coutSup  = copiesSupMono * client.PrixCopieSupMono + copiesSupCoul * client.PrixCopieSupCouleur;
        decimal totalHT  = client.ForfaitMensuelHT + coutSup;
        decimal tva      = Math.Round(totalHT * client.TauxTVA / 100, 0);
        decimal totalTTC = totalHT + tva;

        return Ok(new FactureMensuelleDto(
            client.Id, client.NomClient, client.NumeroContrat,
            annee, mois,
            totalMono, totalCoul,
            client.ForfaitCopieMono, client.ForfaitCopieCouleur,
            copiesSupMono, copiesSupCoul,
            client.ForfaitMensuelHT, coutSup,
            totalHT, client.TauxTVA, tva, totalTTC,
            details));
    }

    private static ReleveCompteurDto MapToDto(ReleveCompteur r) => new(
        r.Id, r.CopieurId,
        r.Copieur?.Designation ?? "",
        r.Copieur?.NumeroSerie ?? "",
        r.Copieur?.Client?.NomClient ?? "",
        r.Annee, r.Mois,
        r.A3MonoDebut, r.A4MonoDebut, r.A3CoulDebut, r.A4CoulDebut,
        r.A3MonoFin,   r.A4MonoFin,   r.A3CoulFin,   r.A4CoulFin,
        r.CopiesMonoA4Eq, r.CopiesCoulA4Eq,
        r.CreatedAt);
}
