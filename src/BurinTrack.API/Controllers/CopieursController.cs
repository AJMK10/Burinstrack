using BurinTrack.Application.DTOs;
using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/copieurs")]
[Authorize(Policy = "CanViewAll")]
public class CopieursController : ControllerBase
{
    private readonly BurinTrackDbContext _db;

    public CopieursController(BurinTrackDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CopieurDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? clientId,
        [FromQuery] StatutCopieur? situation,
        CancellationToken ct)
    {
        var query = _db.Copieurs.AsNoTracking().Include(c => c.Client).AsQueryable();

        if (clientId.HasValue) query = query.Where(c => c.ClientId == clientId);
        if (situation.HasValue) query = query.Where(c => c.Situation == situation);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(c =>
                c.NumeroSerie.ToLower().Contains(s) ||
                c.Marque.ToLower().Contains(s) ||
                c.Modele.ToLower().Contains(s) ||
                c.Designation.ToLower().Contains(s) ||
                c.Client.NomClient.ToLower().Contains(s));
        }

        var list = await query.OrderBy(c => c.Client.NomClient).ThenBy(c => c.Designation).ToListAsync(ct);
        return Ok(list.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CopieurDto>> GetById(Guid id, CancellationToken ct)
    {
        var copieur = await _db.Copieurs.AsNoTracking().Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
        return copieur is null ? NotFound() : Ok(MapToDto(copieur));
    }

    [HttpPost]
    [Authorize(Policy = "CanManageClients")]
    public async Task<ActionResult<CopieurDto>> Create([FromBody] CreateCopieurDto dto, CancellationToken ct)
    {
        if (!await _db.Clients.AnyAsync(c => c.Id == dto.ClientId, ct))
            return BadRequest("Client introuvable.");
        if (await _db.Copieurs.AnyAsync(c => c.NumeroSerie == dto.NumeroSerie, ct))
            return Conflict($"Le numéro de série '{dto.NumeroSerie}' existe déjà.");

        var copieur = new Copieur
        {
            ClientId = dto.ClientId,
            Marque = dto.Marque,
            Modele = dto.Modele,
            Designation = string.IsNullOrWhiteSpace(dto.Designation) ? $"{dto.Marque} {dto.Modele}" : dto.Designation,
            NumeroSerie = dto.NumeroSerie,
            DateDebutContrat = DateTime.SpecifyKind(dto.DateDebutContrat, DateTimeKind.Utc),
            DateFinContrat = DateTime.SpecifyKind(dto.DateFinContrat, DateTimeKind.Utc),
            AdresseIP = dto.AdresseIP,
            Localisation = dto.Localisation,
            NotesTechniques = dto.NotesTechniques
        };

        _db.Copieurs.Add(copieur);
        await _db.SaveChangesAsync(ct);

        await _db.Entry(copieur).Reference(c => c.Client).LoadAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = copieur.Id }, MapToDto(copieur));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CanManageClients")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCopieurDto dto, CancellationToken ct)
    {
        var copieur = await _db.Copieurs.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (copieur is null) return NotFound();

        copieur.Marque = dto.Marque;
        copieur.Modele = dto.Modele;
        copieur.Designation = dto.Designation;
        copieur.DateDebutContrat = DateTime.SpecifyKind(dto.DateDebutContrat, DateTimeKind.Utc);
        copieur.DateFinContrat = DateTime.SpecifyKind(dto.DateFinContrat, DateTimeKind.Utc);
        copieur.StatutContrat = dto.StatutContrat;
        copieur.Situation = dto.Situation;
        copieur.AdresseIP = dto.AdresseIP;
        copieur.Localisation = dto.Localisation;
        copieur.NotesTechniques = dto.NotesTechniques;

        await _db.SaveChangesAsync(ct);
        return NoContent();
    }

    private static CopieurDto MapToDto(Copieur c) => new(
        c.Id, c.ClientId, c.Client?.NomClient ?? "",
        c.Marque, c.Modele, c.Designation, c.NumeroSerie,
        c.DateDebutContrat, c.DateFinContrat,
        c.StatutContrat, c.Situation,
        c.AdresseIP, c.Localisation, c.NotesTechniques,
        (int)Math.Ceiling((c.DateFinContrat - DateTime.UtcNow).TotalDays),
        c.CreatedAt);
}
