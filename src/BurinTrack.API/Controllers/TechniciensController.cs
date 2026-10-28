using BurinTrack.Application.DTOs;
using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/techniciens")]
[Authorize(Policy = "CanViewAll")]
public class TechniciensController : ControllerBase
{
    private readonly BurinTrackDbContext _db;

    public TechniciensController(BurinTrackDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TechnicienDto>>> GetAll(CancellationToken ct)
    {
        var list = await _db.Techniciens.AsNoTracking()
            .OrderBy(t => t.Nom).ThenBy(t => t.Prenom)
            .Select(t => new TechnicienDto(
                t.Id, t.Nom, t.Prenom, (t.Prenom + " " + t.Nom).Trim(),
                t.Telephone, t.Email, t.EstActif,
                t.Interventions.Count,
                t.Interventions.Count(i => i.Statut == StatutIntervention.Ouverte || i.Statut == StatutIntervention.EnCours),
                t.CreatedAt))
            .ToListAsync(ct);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<TechnicienDto>> Create([FromBody] CreateTechnicienDto dto, CancellationToken ct)
    {
        if (await _db.Techniciens.AnyAsync(t => t.Email == dto.Email, ct))
            return Conflict("Un technicien avec cet e-mail existe déjà.");

        var technicien = new Technicien
        {
            UserId = string.Empty,
            Nom = dto.Nom,
            Prenom = dto.Prenom,
            Telephone = dto.Telephone,
            Email = dto.Email
        };
        _db.Techniciens.Add(technicien);
        await _db.SaveChangesAsync(ct);

        return Created($"/api/techniciens/{technicien.Id}", new TechnicienDto(
            technicien.Id, technicien.Nom, technicien.Prenom,
            $"{technicien.Prenom} {technicien.Nom}".Trim(),
            technicien.Telephone, technicien.Email, technicien.EstActif, 0, 0, technicien.CreatedAt));
    }
}
