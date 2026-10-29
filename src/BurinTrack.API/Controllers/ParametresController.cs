using BurinTrack.Application.DTOs;
using BurinTrack.Domain.Entities;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/parametres")]
[Authorize(Policy = "AdminOnly")]
public class ParametresController : ControllerBase
{
    private readonly BurinTrackDbContext _db;
    public ParametresController(BurinTrackDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ParametreDto>>> GetAll(CancellationToken ct)
    {
        var list = await _db.Parametres.AsNoTracking().ToListAsync(ct);
        return Ok(list.Select(p => new ParametreDto(p.Cle, p.Valeur, p.UpdatedAt)));
    }

    // Endpoint public (sans authentification) — expose uniquement les champs visuels non sensibles
    [AllowAnonymous]
    [HttpGet("vitrine")]
    public async Task<ActionResult<object>> GetVitrine(CancellationToken ct)
    {
        var p = await _db.Parametres.AsNoTracking().FirstOrDefaultAsync(x => x.Cle == "entreprise", ct);
        if (p is null) return Ok(new { logoBase64 = "", imageDashboard = "", nomApplication = "BurinTrack", nomSociete = "BURINFORT" });
        try
        {
            var doc = JsonDocument.Parse(p.Valeur);
            var root = doc.RootElement;
            return Ok(new
            {
                logoBase64     = root.TryGetProperty("logoBase64",     out var l) ? l.GetString() ?? "" : "",
                imageDashboard = root.TryGetProperty("imageDashboard", out var i) ? i.GetString() ?? "" : "",
                nomApplication = root.TryGetProperty("nomApplication", out var n) ? n.GetString() ?? "BurinTrack" : "BurinTrack",
                nomSociete     = root.TryGetProperty("nomSociete",     out var s) ? s.GetString() ?? "BURINFORT"  : "BURINFORT",
            });
        }
        catch { return Ok(new { logoBase64 = "", imageDashboard = "", nomApplication = "BurinTrack", nomSociete = "BURINFORT" }); }
    }

    [HttpPut("{cle}")]
    public async Task<ActionResult> Update(string cle, [FromBody] UpdateParametreDto dto, CancellationToken ct)
    {
        var p = await _db.Parametres.FindAsync(new object[] { cle }, ct);
        if (p is null)
        {
            p = new Parametre { Cle = cle };
            _db.Parametres.Add(p);
        }
        p.Valeur = dto.Valeur;
        p.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
        return Ok(new ParametreDto(p.Cle, p.Valeur, p.UpdatedAt));
    }
}
