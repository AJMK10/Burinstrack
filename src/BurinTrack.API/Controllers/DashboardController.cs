using System.Globalization;
using BurinTrack.Application.DTOs;
using BurinTrack.Domain.Enums;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = "CanViewAll")]
public class DashboardController : ControllerBase
{
    private static readonly CultureInfo Fr = new("fr-FR");
    private readonly BurinTrackDbContext _db;

    public DashboardController(BurinTrackDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> Get(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        var totalClients = await _db.Clients.CountAsync(c => c.EstActif, ct);
        var totalCopieurs = await _db.Copieurs.CountAsync(ct);
        var contratsActifs = await _db.Copieurs.CountAsync(c => c.StatutContrat == StatutContrat.Actif, ct);
        var totalTechniciens = await _db.Techniciens.CountAsync(t => t.EstActif, ct);

        var ouvertes = await _db.Interventions.CountAsync(i => i.Statut == StatutIntervention.Ouverte, ct);
        var enCours = await _db.Interventions.CountAsync(i => i.Statut == StatutIntervention.EnCours, ct);
        var resolues = await _db.Interventions.CountAsync(i => i.Statut == StatutIntervention.Resolue, ct);
        var fermees = await _db.Interventions.CountAsync(i => i.Statut == StatutIntervention.Fermee, ct);

        // Contrats
        var limite30 = now.AddDays(30);
        var limite60 = now.AddDays(60);
        var expirant30 = await _db.Copieurs.CountAsync(c =>
            c.StatutContrat == StatutContrat.Actif && c.DateFinContrat >= now && c.DateFinContrat <= limite30, ct);
        var expirant60 = await _db.Copieurs.CountAsync(c =>
            c.StatutContrat == StatutContrat.Actif && c.DateFinContrat >= now && c.DateFinContrat <= limite60, ct);

        var aExpirer = await _db.Copieurs.AsNoTracking()
            .Include(c => c.Client)
            .Where(c => c.StatutContrat == StatutContrat.Actif && c.DateFinContrat <= limite60)
            .OrderBy(c => c.DateFinContrat)
            .Take(10)
            .ToListAsync(ct);
        var expirations = aExpirer.Select(c => new CopieurExpirationDto(
            c.Id, c.Designation, c.NumeroSerie, c.Client?.NomClient ?? "",
            c.DateFinContrat, (int)Math.Ceiling((c.DateFinContrat - now).TotalDays)));

        // Interventions par technicien
        var parTech = await _db.Interventions.AsNoTracking()
            .GroupBy(i => new { i.TechnicienId, i.Technicien.Prenom, i.Technicien.Nom })
            .Select(g => new
            {
                g.Key.Prenom,
                g.Key.Nom,
                Total = g.Count(),
                Resolues = g.Count(i => i.Statut == StatutIntervention.Resolue || i.Statut == StatutIntervention.Fermee)
            })
            .OrderByDescending(x => x.Total)
            .ToListAsync(ct);
        var techDtos = parTech.Select(x =>
            new InterventionsParTechnicienDto($"{x.Prenom} {x.Nom}".Trim(), x.Total, x.Resolues));

        // Interventions par mois (6 derniers mois)
        var debut = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-5);
        var recentes = await _db.Interventions.AsNoTracking()
            .Where(i => i.DateIntervention >= debut)
            .Select(i => new { i.DateIntervention, i.Nature })
            .ToListAsync(ct);
        var parMois = Enumerable.Range(0, 6).Select(n =>
        {
            var m = debut.AddMonths(n);
            var duMois = recentes.Where(r => r.DateIntervention.Year == m.Year && r.DateIntervention.Month == m.Month).ToList();
            return new InterventionsParMoisDto(
                $"{m:yyyy-MM}",
                Fr.TextInfo.ToTitleCase(Fr.DateTimeFormat.GetAbbreviatedMonthName(m.Month).TrimEnd('.')),
                duMois.Count,
                duMois.Count(r => r.Nature == NatureIntervention.Panne));
        }).ToList();

        // Répartition par nature
        var parNature = await _db.Interventions.AsNoTracking()
            .GroupBy(i => i.Nature)
            .Select(g => new { g.Key, Total = g.Count() })
            .ToListAsync(ct);
        var natureDtos = parNature.OrderByDescending(x => x.Total)
            .Select(x => new RepartitionDto(x.Key.ToString(), x.Total));

        // Pannes récurrentes
        var pannes = await _db.Interventions.AsNoTracking()
            .Where(i => i.Nature == NatureIntervention.Panne)
            .GroupBy(i => new { i.CopieurId, i.Copieur.Designation, i.Copieur.NumeroSerie, i.Client.NomClient })
            .Select(g => new { g.Key.CopieurId, g.Key.Designation, g.Key.NumeroSerie, g.Key.NomClient, Nb = g.Count() })
            .Where(x => x.Nb >= 2)
            .OrderByDescending(x => x.Nb)
            .Take(5)
            .ToListAsync(ct);
        var pannesDtos = pannes.Select(p =>
            new PanneRecurrenteDto(p.CopieurId, p.Designation, p.NumeroSerie, p.NomClient, p.Nb));

        // Volumes
        var volumes = await _db.Interventions.AsNoTracking()
            .GroupBy(i => i.Client.NomClient)
            .Select(g => new
            {
                Nom = g.Key,
                NB = g.Sum(i => i.CompteurNBActuel - i.CompteurNBPrecedent),
                Couleur = g.Sum(i => i.CompteurCouleurActuel - i.CompteurCouleurPrecedent)
            })
            .OrderByDescending(x => x.NB + x.Couleur)
            .ToListAsync(ct);
        var volumeDto = new VolumeDto(
            volumes.Sum(v => v.NB),
            volumes.Sum(v => v.Couleur),
            volumes.Take(8).Select(v => new VolumeParClientDto(v.Nom, v.NB, v.Couleur)));

        return Ok(new DashboardDto(
            totalClients, totalCopieurs, contratsActifs,
            ouvertes, enCours, resolues, fermees, totalTechniciens,
            expirant30, expirant60,
            techDtos, expirations, parMois, natureDtos, pannesDtos, volumeDto));
    }
}
