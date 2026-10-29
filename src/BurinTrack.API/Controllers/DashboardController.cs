using System.Globalization;
using System.Text;
using BurinTrack.Application.DTOs;
using BurinTrack.Application.Interfaces;
using BurinTrack.Domain.Enums;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
    private readonly IEmailService _email;
    private readonly UserManager<IdentityUser> _userManager;

    public DashboardController(BurinTrackDbContext db, IEmailService email, UserManager<IdentityUser> userManager)
    {
        _db = db;
        _email = email;
        _userManager = userManager;
    }

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

    [HttpPost("alertes-contrats")]
    [Authorize(Policy = "CanManageClients")]
    public async Task<ActionResult> EnvoyerAlertesContrats(CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var limite60 = now.AddDays(60);

        var contrats = await _db.Copieurs.AsNoTracking()
            .Include(c => c.Client)
            .Where(c => c.StatutContrat == StatutContrat.Actif && c.DateFinContrat <= limite60)
            .OrderBy(c => c.DateFinContrat)
            .ToListAsync(ct);

        if (contrats.Count == 0)
            return Ok(new { envoyes = 0, message = "Aucun contrat n'expire dans les 60 prochains jours." });

        var users = _userManager.Users.ToList();
        var destinataires = users.Where(u => !string.IsNullOrEmpty(u.Email)).Select(u => u.Email!).ToList();

        if (destinataires.Count == 0)
            return Ok(new { envoyes = 0, message = "Aucun utilisateur avec un email trouvé." });

        var rows = new StringBuilder();
        foreach (var c in contrats)
        {
            var jours = (int)Math.Ceiling((c.DateFinContrat - now).TotalDays);
            var urgence = jours <= 0 ? "#dc2626" : jours <= 30 ? "#d97706" : "#059669";
            var label = jours <= 0 ? $"Expiré ({Math.Abs(jours)} j)" : $"J-{jours}";
            rows.Append($"""
                <tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">{c.Client?.NomClient ?? "—"}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">{c.Designation}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:0.85em">{c.NumeroSerie}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">{c.DateFinContrat:dd/MM/yyyy}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">
                    <span style="background:{urgence};color:#fff;padding:2px 8px;border-radius:9999px;font-size:0.78em;font-weight:700">{label}</span>
                  </td>
                </tr>
                """);
        }

        var corps = $"""
            <!DOCTYPE html><html><body style="font-family:sans-serif;color:#111;max-width:700px;margin:auto;padding:24px">
            <div style="background:#CC1416;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0">
              <h2 style="margin:0;font-size:1.2rem">⚠️ Alerte — Contrats arrivant à échéance</h2>
              <p style="margin:6px 0 0;opacity:.8;font-size:.85rem">BurinTrack · {DateTime.Now:dd MMMM yyyy}</p>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;padding:20px 24px;border-radius:0 0 8px 8px">
              <p>{contrats.Count} contrat(s) arrivent à échéance dans les <strong>60 prochains jours</strong>.</p>
              <table style="width:100%;border-collapse:collapse;font-size:.9rem">
                <thead>
                  <tr style="background:#f9fafb;text-align:left">
                    <th style="padding:8px 12px;border-bottom:2px solid #e5e7eb">Client</th>
                    <th style="padding:8px 12px;border-bottom:2px solid #e5e7eb">Machine</th>
                    <th style="padding:8px 12px;border-bottom:2px solid #e5e7eb">N° de série</th>
                    <th style="padding:8px 12px;border-bottom:2px solid #e5e7eb">Échéance</th>
                    <th style="padding:8px 12px;border-bottom:2px solid #e5e7eb">Délai</th>
                  </tr>
                </thead>
                <tbody>{rows}</tbody>
              </table>
              <p style="margin-top:20px;font-size:.8rem;color:#6b7280">Cet email a été envoyé automatiquement par BurinTrack — BURINFORT.</p>
            </div>
            </body></html>
            """;

        var erreurs = 0;
        foreach (var email in destinataires)
        {
            try { await _email.EnvoyerAsync(email, $"[BurinTrack] {contrats.Count} contrat(s) expirent bientôt", corps, ct); }
            catch { erreurs++; }
        }

        return Ok(new
        {
            envoyes = destinataires.Count - erreurs,
            erreurs,
            total = contrats.Count,
            message = $"Alerte envoyée à {destinataires.Count - erreurs}/{destinataires.Count} utilisateur(s)."
        });
    }
}
