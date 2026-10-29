using BurinTrack.Domain.Enums;
using BurinTrack.Infrastructure.Persistence;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/rapports")]
[Authorize(Policy = "CanViewAll")]
public class RapportsController : ControllerBase
{
    private readonly BurinTrackDbContext _db;

    public RapportsController(BurinTrackDbContext db)
    {
        _db = db;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    private (DateTime debut, DateTime fin) ParsePeriode(string? dateDebut, string? dateFin)
    {
        var debut = DateTime.TryParse(dateDebut, out var d) ? d.ToUniversalTime() : DateTime.UtcNow.AddMonths(-1);
        var fin = DateTime.TryParse(dateFin, out var f) ? f.AddDays(1).ToUniversalTime() : DateTime.UtcNow.AddDays(1);
        return (debut, fin);
    }

    // ─── Interventions ───────────────────────────────────────────────────────

    [HttpGet("interventions")]
    public async Task<IActionResult> Interventions(
        [FromQuery] string? dateDebut, [FromQuery] string? dateFin,
        [FromQuery] string format = "excel", CancellationToken ct = default)
    {
        var (debut, fin) = ParsePeriode(dateDebut, dateFin);

        var rows = await _db.Interventions.AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.Copieur)
            .Include(i => i.Technicien)
            .Where(i => i.DateIntervention >= debut && i.DateIntervention < fin)
            .OrderByDescending(i => i.DateIntervention)
            .ToListAsync(ct);

        if (format == "pdf")
        {
            var pdf = Document.Create(c =>
            {
                c.Page(p =>
                {
                    p.Size(PageSizes.A4.Landscape());
                    p.Margin(1.5f, Unit.Centimetre);
                    p.Header().Element(e => PdfHeader(e, "Rapport d'interventions", dateDebut, dateFin));
                    p.Content().PaddingTop(8).Table(t =>
                    {
                        t.ColumnsDefinition(cd =>
                        {
                            cd.RelativeColumn(1.2f);
                            cd.RelativeColumn(2f);
                            cd.RelativeColumn(2f);
                            cd.RelativeColumn(2.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.2f);
                        });
                        t.Header(h =>
                        {
                            foreach (var col in new[] { "Date", "N° Intervention", "Client", "Copieur", "Technicien", "Nature", "Statut" })
                                PdfTh(h, col);
                        });
                        foreach (var (row, idx) in rows.Select((r, i) => (r, i)))
                        {
                            var bg = idx % 2 == 0 ? "#FFFFFF" : "#F9FAFB";
                            PdfTd(t, row.DateIntervention.ToString("dd/MM/yyyy"), bg);
                            PdfTd(t, row.NumeroIntervention, bg);
                            PdfTd(t, row.Client?.NomClient ?? "", bg);
                            PdfTd(t, $"{row.Copieur?.Designation} ({row.Copieur?.NumeroSerie})", bg);
                            PdfTd(t, $"{row.Technicien?.Prenom} {row.Technicien?.Nom}".Trim(), bg);
                            PdfTd(t, NatureLabel(row.Nature), bg);
                            PdfTd(t, StatutLabel(row.Statut), bg);
                        }
                    });
                    p.Footer().Element(PdfFooter);
                });
            }).GeneratePdf();
            return File(pdf, "application/pdf", $"interventions_{dateDebut}_{dateFin}.pdf");
        }

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Interventions");
        ExcelHeader(ws, "Rapport d'interventions SAV",
            new[] { "Date", "N° Intervention", "Client", "Copieur", "N° Série", "Technicien", "Nature", "Statut",
                    "Cpt NB préc.", "Cpt NB act.", "Vol. NB", "Cpt Coul. préc.", "Cpt Coul. act.", "Vol. Couleur",
                    "Description" });
        int row = 3;
        foreach (var i in rows)
        {
            ws.Cell(row, 1).Value = i.DateIntervention.ToString("dd/MM/yyyy");
            ws.Cell(row, 2).Value = i.NumeroIntervention;
            ws.Cell(row, 3).Value = i.Client?.NomClient ?? "";
            ws.Cell(row, 4).Value = i.Copieur?.Designation ?? "";
            ws.Cell(row, 5).Value = i.Copieur?.NumeroSerie ?? "";
            ws.Cell(row, 6).Value = $"{i.Technicien?.Prenom} {i.Technicien?.Nom}".Trim();
            ws.Cell(row, 7).Value = NatureLabel(i.Nature);
            ws.Cell(row, 8).Value = StatutLabel(i.Statut);
            ws.Cell(row, 9).Value = i.CompteurNBPrecedent;
            ws.Cell(row, 10).Value = i.CompteurNBActuel;
            ws.Cell(row, 11).Value = i.VolumeNBConsomme;
            ws.Cell(row, 12).Value = i.CompteurCouleurPrecedent;
            ws.Cell(row, 13).Value = i.CompteurCouleurActuel;
            ws.Cell(row, 14).Value = i.VolumeCouleurConsomme;
            ws.Cell(row, 15).Value = i.DescriptionProbleme;
            if (row % 2 == 0) ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(249, 250, 251);
            row++;
        }
        ExcelFinalize(ws, 15);
        return ExcelResult(wb, $"interventions_{dateDebut}_{dateFin}.xlsx");
    }

    // ─── Clients ─────────────────────────────────────────────────────────────

    [HttpGet("clients")]
    public async Task<IActionResult> Clients(
        [FromQuery] string? dateDebut, [FromQuery] string? dateFin,
        [FromQuery] string format = "excel", CancellationToken ct = default)
    {
        var rows = await _db.Clients.AsNoTracking()
            .Include(c => c.Copieurs)
            .OrderBy(c => c.NomClient)
            .ToListAsync(ct);

        if (format == "pdf")
        {
            var pdf = Document.Create(c =>
            {
                c.Page(p =>
                {
                    p.Size(PageSizes.A4);
                    p.Margin(1.5f, Unit.Centimetre);
                    p.Header().Element(e => PdfHeader(e, "Liste des clients", null, null));
                    p.Content().PaddingTop(8).Table(t =>
                    {
                        t.ColumnsDefinition(cd =>
                        {
                            cd.RelativeColumn(2.5f);
                            cd.RelativeColumn(2f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(2f);
                            cd.RelativeColumn(1f);
                        });
                        t.Header(h =>
                        {
                            foreach (var col in new[] { "Client", "Ville", "Téléphone", "Email", "Copieurs" })
                                PdfTh(h, col);
                        });
                        foreach (var (row, idx) in rows.Select((r, i) => (r, i)))
                        {
                            var bg = idx % 2 == 0 ? "#FFFFFF" : "#F9FAFB";
                            PdfTd(t, row.NomClient, bg);
                            PdfTd(t, row.Ville, bg);
                            PdfTd(t, row.Telephone, bg);
                            PdfTd(t, row.Email, bg);
                            PdfTd(t, row.Copieurs.Count.ToString(), bg);
                        }
                    });
                    p.Footer().Element(PdfFooter);
                });
            }).GeneratePdf();
            return File(pdf, "application/pdf", "clients.pdf");
        }

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Clients");
        ExcelHeader(ws, "Liste des clients",
            new[] { "Nom client", "Raison sociale", "Secteur", "Ville", "Commune", "Téléphone", "Email",
                    "Contact", "Fonction", "Nb copieurs", "Actif" });
        int row = 3;
        foreach (var c2 in rows)
        {
            ws.Cell(row, 1).Value = c2.NomClient;
            ws.Cell(row, 2).Value = c2.RaisonSociale;
            ws.Cell(row, 3).Value = c2.SecteurActivite;
            ws.Cell(row, 4).Value = c2.Ville;
            ws.Cell(row, 5).Value = c2.Commune;
            ws.Cell(row, 6).Value = c2.Telephone;
            ws.Cell(row, 7).Value = c2.Email;
            ws.Cell(row, 8).Value = c2.NomContact;
            ws.Cell(row, 9).Value = c2.FonctionContact;
            ws.Cell(row, 10).Value = c2.Copieurs.Count;
            ws.Cell(row, 11).Value = c2.EstActif ? "Oui" : "Non";
            if (row % 2 == 0) ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(249, 250, 251);
            row++;
        }
        ExcelFinalize(ws, 11);
        return ExcelResult(wb, "clients.xlsx");
    }

    // ─── Copieurs ────────────────────────────────────────────────────────────

    [HttpGet("copieurs")]
    public async Task<IActionResult> Copieurs(
        [FromQuery] string? dateDebut, [FromQuery] string? dateFin,
        [FromQuery] string format = "excel", CancellationToken ct = default)
    {
        var rows = await _db.Copieurs.AsNoTracking()
            .Include(c => c.Client)
            .Include(c => c.Interventions)
            .OrderBy(c => c.Client.NomClient).ThenBy(c => c.Designation)
            .ToListAsync(ct);

        if (format == "pdf")
        {
            var pdf = Document.Create(c =>
            {
                c.Page(p =>
                {
                    p.Size(PageSizes.A4.Landscape());
                    p.Margin(1.5f, Unit.Centimetre);
                    p.Header().Element(e => PdfHeader(e, "Parc copieurs", null, null));
                    p.Content().PaddingTop(8).Table(t =>
                    {
                        t.ColumnsDefinition(cd =>
                        {
                            cd.RelativeColumn(2f);
                            cd.RelativeColumn(2.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.2f);
                        });
                        t.Header(h =>
                        {
                            foreach (var col in new[] { "Client", "Désignation", "N° Série", "Début contrat", "Fin contrat", "Statut" })
                                PdfTh(h, col);
                        });
                        foreach (var (row, idx) in rows.Select((r, i) => (r, i)))
                        {
                            var bg = idx % 2 == 0 ? "#FFFFFF" : "#F9FAFB";
                            PdfTd(t, row.Client?.NomClient ?? "", bg);
                            PdfTd(t, $"{row.Marque} {row.Modele} – {row.Designation}", bg);
                            PdfTd(t, row.NumeroSerie, bg);
                            PdfTd(t, row.DateDebutContrat.ToString("dd/MM/yyyy"), bg);
                            PdfTd(t, row.DateFinContrat.ToString("dd/MM/yyyy"), bg);
                            PdfTd(t, ContratLabel(row.StatutContrat), bg);
                        }
                    });
                    p.Footer().Element(PdfFooter);
                });
            }).GeneratePdf();
            return File(pdf, "application/pdf", "parc_copieurs.pdf");
        }

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Copieurs");
        ExcelHeader(ws, "Parc copieurs",
            new[] { "Client", "Marque", "Modèle", "Désignation", "N° Série", "Localisation",
                    "Début contrat", "Fin contrat", "Statut contrat", "Situation", "Nb interventions" });
        int row = 3;
        foreach (var c2 in rows)
        {
            ws.Cell(row, 1).Value = c2.Client?.NomClient ?? "";
            ws.Cell(row, 2).Value = c2.Marque;
            ws.Cell(row, 3).Value = c2.Modele;
            ws.Cell(row, 4).Value = c2.Designation;
            ws.Cell(row, 5).Value = c2.NumeroSerie;
            ws.Cell(row, 6).Value = c2.Localisation ?? "";
            ws.Cell(row, 7).SetValue(c2.DateDebutContrat.ToString("dd/MM/yyyy"));
            ws.Cell(row, 8).SetValue(c2.DateFinContrat.ToString("dd/MM/yyyy"));
            ws.Cell(row, 9).Value = ContratLabel(c2.StatutContrat);
            ws.Cell(row, 10).Value = SituationLabel(c2.Situation);
            ws.Cell(row, 11).Value = c2.Interventions.Count;
            if (row % 2 == 0) ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(249, 250, 251);
            row++;
        }
        ExcelFinalize(ws, 11);
        return ExcelResult(wb, "parc_copieurs.xlsx");
    }

    // ─── Compteurs ───────────────────────────────────────────────────────────

    [HttpGet("compteurs")]
    public async Task<IActionResult> Compteurs(
        [FromQuery] string? dateDebut, [FromQuery] string? dateFin,
        [FromQuery] string format = "excel", CancellationToken ct = default)
    {
        var (debut, fin) = ParsePeriode(dateDebut, dateFin);

        var rows = await _db.Interventions.AsNoTracking()
            .Include(i => i.Client)
            .Include(i => i.Copieur)
            .Include(i => i.Technicien)
            .Where(i => i.DateIntervention >= debut && i.DateIntervention < fin)
            .OrderBy(i => i.Client.NomClient).ThenBy(i => i.Copieur.Designation).ThenBy(i => i.DateIntervention)
            .ToListAsync(ct);

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Compteurs");
        ExcelHeader(ws, "Relevés de compteurs",
            new[] { "Date", "Client", "Copieur", "N° Série", "Technicien",
                    "Cpt NB préc.", "Cpt NB act.", "Vol. NB",
                    "Cpt Coul. préc.", "Cpt Coul. act.", "Vol. Couleur" });
        int row = 3;
        foreach (var i in rows)
        {
            ws.Cell(row, 1).Value = i.DateIntervention.ToString("dd/MM/yyyy");
            ws.Cell(row, 2).Value = i.Client?.NomClient ?? "";
            ws.Cell(row, 3).Value = i.Copieur?.Designation ?? "";
            ws.Cell(row, 4).Value = i.Copieur?.NumeroSerie ?? "";
            ws.Cell(row, 5).Value = $"{i.Technicien?.Prenom} {i.Technicien?.Nom}".Trim();
            ws.Cell(row, 6).Value = i.CompteurNBPrecedent;
            ws.Cell(row, 7).Value = i.CompteurNBActuel;
            ws.Cell(row, 8).Value = i.VolumeNBConsomme;
            ws.Cell(row, 9).Value = i.CompteurCouleurPrecedent;
            ws.Cell(row, 10).Value = i.CompteurCouleurActuel;
            ws.Cell(row, 11).Value = i.VolumeCouleurConsomme;
            if (row % 2 == 0) ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(249, 250, 251);
            row++;
        }
        // Ligne totaux
        if (row > 3)
        {
            var totalRow = row;
            ws.Cell(totalRow, 7).Value = "TOTAL NB";
            ws.Cell(totalRow, 8).Value = rows.Sum(r => r.VolumeNBConsomme);
            ws.Cell(totalRow, 10).Value = "TOTAL COUL.";
            ws.Cell(totalRow, 11).Value = rows.Sum(r => r.VolumeCouleurConsomme);
            ws.Row(totalRow).Style.Font.Bold = true;
            ws.Row(totalRow).Style.Fill.BackgroundColor = XLColor.FromArgb(204, 20, 22);
            ws.Row(totalRow).Style.Font.FontColor = XLColor.White;
        }
        ExcelFinalize(ws, 11);
        return ExcelResult(wb, $"compteurs_{dateDebut}_{dateFin}.xlsx");
    }

    // ─── Contrats ────────────────────────────────────────────────────────────

    [HttpGet("contrats")]
    public async Task<IActionResult> Contrats(
        [FromQuery] string? dateDebut, [FromQuery] string? dateFin,
        [FromQuery] string format = "excel", CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var rows = await _db.Copieurs.AsNoTracking()
            .Include(c => c.Client)
            .OrderBy(c => c.DateFinContrat)
            .ToListAsync(ct);

        if (format == "pdf")
        {
            var pdf = Document.Create(c =>
            {
                c.Page(p =>
                {
                    p.Size(PageSizes.A4.Landscape());
                    p.Margin(1.5f, Unit.Centimetre);
                    p.Header().Element(e => PdfHeader(e, "Suivi des contrats", null, null));
                    p.Content().PaddingTop(8).Table(t =>
                    {
                        t.ColumnsDefinition(cd =>
                        {
                            cd.RelativeColumn(2f);
                            cd.RelativeColumn(2.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.2f);
                        });
                        t.Header(h =>
                        {
                            foreach (var col in new[] { "Client", "Copieur", "N° Série", "Début", "Fin contrat", "Jours restants" })
                                PdfTh(h, col);
                        });
                        foreach (var (row, idx) in rows.Select((r, i) => (r, i)))
                        {
                            var jours = (int)Math.Ceiling((row.DateFinContrat - now).TotalDays);
                            var bg = idx % 2 == 0 ? "#FFFFFF" : "#F9FAFB";
                            PdfTd(t, row.Client?.NomClient ?? "", bg);
                            PdfTd(t, row.Designation, bg);
                            PdfTd(t, row.NumeroSerie, bg);
                            PdfTd(t, row.DateDebutContrat.ToString("dd/MM/yyyy"), bg);
                            PdfTd(t, row.DateFinContrat.ToString("dd/MM/yyyy"), bg);
                            PdfTd(t, jours < 0 ? "Expiré" : $"{jours} j", bg);
                        }
                    });
                    p.Footer().Element(PdfFooter);
                });
            }).GeneratePdf();
            return File(pdf, "application/pdf", "contrats.pdf");
        }

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Contrats");
        ExcelHeader(ws, "Suivi des contrats",
            new[] { "Client", "Copieur", "N° Série", "Statut contrat", "Début contrat", "Fin contrat", "Jours restants", "Statut échéance" });
        int row = 3;
        foreach (var c2 in rows)
        {
            var jours = (int)Math.Ceiling((c2.DateFinContrat - now).TotalDays);
            ws.Cell(row, 1).Value = c2.Client?.NomClient ?? "";
            ws.Cell(row, 2).Value = c2.Designation;
            ws.Cell(row, 3).Value = c2.NumeroSerie;
            ws.Cell(row, 4).Value = ContratLabel(c2.StatutContrat);
            ws.Cell(row, 5).SetValue(c2.DateDebutContrat.ToString("dd/MM/yyyy"));
            ws.Cell(row, 6).SetValue(c2.DateFinContrat.ToString("dd/MM/yyyy"));
            ws.Cell(row, 7).Value = jours;
            ws.Cell(row, 8).Value = jours < 0 ? "Expiré" : jours <= 30 ? "Urgent" : jours <= 60 ? "Proche" : "OK";
            var echeanceCouleur = jours < 0 ? XLColor.FromArgb(254, 202, 202)
                : jours <= 30 ? XLColor.FromArgb(254, 243, 199)
                : XLColor.FromArgb(220, 252, 231);
            ws.Cell(row, 8).Style.Fill.BackgroundColor = echeanceCouleur;
            if (row % 2 == 0) ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(249, 250, 251);
            row++;
        }
        ExcelFinalize(ws, 8);
        return ExcelResult(wb, "contrats.xlsx");
    }

    // ─── Techniciens ─────────────────────────────────────────────────────────

    [HttpGet("techniciens")]
    public async Task<IActionResult> Techniciens(
        [FromQuery] string? dateDebut, [FromQuery] string? dateFin,
        [FromQuery] string format = "excel", CancellationToken ct = default)
    {
        var (debut, fin) = ParsePeriode(dateDebut, dateFin);

        var rows = await _db.Techniciens.AsNoTracking()
            .Include(t => t.Interventions.Where(i => i.DateIntervention >= debut && i.DateIntervention < fin))
            .OrderBy(t => t.Nom)
            .ToListAsync(ct);

        if (format == "pdf")
        {
            var pdf = Document.Create(c =>
            {
                c.Page(p =>
                {
                    p.Size(PageSizes.A4);
                    p.Margin(1.5f, Unit.Centimetre);
                    p.Header().Element(e => PdfHeader(e, "Activité techniciens", dateDebut, dateFin));
                    p.Content().PaddingTop(8).Table(t =>
                    {
                        t.ColumnsDefinition(cd =>
                        {
                            cd.RelativeColumn(2f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.5f);
                            cd.RelativeColumn(1.5f);
                        });
                        t.Header(h =>
                        {
                            foreach (var col in new[] { "Technicien", "Total", "Résolues", "Taux clôture", "Pannes" })
                                PdfTh(h, col);
                        });
                        foreach (var (row, idx) in rows.Select((r, i) => (r, i)))
                        {
                            var total = row.Interventions.Count;
                            var resolues = row.Interventions.Count(i => i.Statut is StatutIntervention.Resolue or StatutIntervention.Fermee);
                            var pannes = row.Interventions.Count(i => i.Nature == NatureIntervention.Panne);
                            var taux = total > 0 ? $"{Math.Round((double)resolues / total * 100, 1)}%" : "–";
                            var bg = idx % 2 == 0 ? "#FFFFFF" : "#F9FAFB";
                            PdfTd(t, $"{row.Prenom} {row.Nom}".Trim(), bg);
                            PdfTd(t, total.ToString(), bg);
                            PdfTd(t, resolues.ToString(), bg);
                            PdfTd(t, taux, bg);
                            PdfTd(t, pannes.ToString(), bg);
                        }
                    });
                    p.Footer().Element(PdfFooter);
                });
            }).GeneratePdf();
            return File(pdf, "application/pdf", $"techniciens_{dateDebut}_{dateFin}.pdf");
        }

        using var wb = new XLWorkbook();
        var ws = wb.AddWorksheet("Techniciens");
        ExcelHeader(ws, "Activité techniciens",
            new[] { "Technicien", "Email", "Téléphone", "Total interventions", "Résolues", "Taux clôture", "Pannes", "Actif" });
        int row = 3;
        foreach (var t2 in rows)
        {
            var total = t2.Interventions.Count;
            var resolues = t2.Interventions.Count(i => i.Statut is StatutIntervention.Resolue or StatutIntervention.Fermee);
            var pannes = t2.Interventions.Count(i => i.Nature == NatureIntervention.Panne);
            var taux = total > 0 ? Math.Round((double)resolues / total * 100, 1) : 0;
            ws.Cell(row, 1).Value = $"{t2.Prenom} {t2.Nom}".Trim();
            ws.Cell(row, 2).Value = t2.Email;
            ws.Cell(row, 3).Value = t2.Telephone;
            ws.Cell(row, 4).Value = total;
            ws.Cell(row, 5).Value = resolues;
            ws.Cell(row, 6).Value = taux / 100;
            ws.Cell(row, 6).Style.NumberFormat.Format = "0.0%";
            ws.Cell(row, 7).Value = pannes;
            ws.Cell(row, 8).Value = t2.EstActif ? "Oui" : "Non";
            if (row % 2 == 0) ws.Row(row).Style.Fill.BackgroundColor = XLColor.FromArgb(249, 250, 251);
            row++;
        }
        ExcelFinalize(ws, 8);
        return ExcelResult(wb, $"techniciens_{dateDebut}_{dateFin}.xlsx");
    }

    // ─── Helpers Excel ────────────────────────────────────────────────────────

    private static void ExcelHeader(IXLWorksheet ws, string title, string[] cols)
    {
        ws.Cell(1, 1).Value = title;
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 14;
        ws.Cell(1, 1).Style.Font.FontColor = XLColor.FromArgb(204, 20, 22);
        ws.Row(1).Height = 28;

        for (int c = 0; c < cols.Length; c++)
        {
            var cell = ws.Cell(2, c + 1);
            cell.Value = cols[c];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromArgb(204, 20, 22);
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }
        ws.Row(2).Height = 22;
    }

    private static void ExcelFinalize(IXLWorksheet ws, int colCount)
    {
        ws.Columns(1, colCount).AdjustToContents();
        var lastRow = ws.LastRowUsed()?.RowNumber() ?? 2;
        if (lastRow >= 3)
        {
            var range = ws.Range(ws.Cell(2, 1), ws.Cell(lastRow, colCount));
            range.Style.Border.OutsideBorder = XLBorderStyleValues.Thin;
            range.Style.Border.InsideBorder = XLBorderStyleValues.Thin;
            range.Style.Border.OutsideBorderColor = XLColor.FromArgb(209, 213, 219);
            range.Style.Border.InsideBorderColor = XLColor.FromArgb(229, 231, 235);
        }
    }

    private FileContentResult ExcelResult(XLWorkbook wb, string fileName)
    {
        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return File(ms.ToArray(),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            fileName);
    }

    // ─── Helpers PDF ──────────────────────────────────────────────────────────

    private static void PdfHeader(IContainer e, string title, string? debut, string? fin)
    {
        e.Row(r =>
        {
            r.RelativeItem().Column(c =>
            {
                c.Item().Text(title).Bold().FontSize(14).FontColor("#CC1416");
                if (debut != null && fin != null)
                    c.Item().Text($"Période : {debut} – {fin}").FontSize(9).FontColor("#6B7280");
            });
            r.ConstantItem(120).AlignRight().Text($"Généré le {DateTime.Now:dd/MM/yyyy}")
                .FontSize(8).FontColor("#9CA3AF");
        });
        e.PaddingTop(4).LineHorizontal(1).LineColor("#CC1416");
    }

    private static void PdfFooter(IContainer e)
    {
        e.LineHorizontal(0.5f).LineColor("#E5E7EB");
        e.PaddingTop(4).Row(r =>
        {
            r.RelativeItem().Text("BurinTrack — BURINFORT S.A.").FontSize(8).FontColor("#9CA3AF");
            r.ConstantItem(80).AlignRight().Text(text =>
            {
                text.CurrentPageNumber().FontSize(8).FontColor("#9CA3AF");
                text.Span(" / ").FontSize(8).FontColor("#9CA3AF");
                text.TotalPages().FontSize(8).FontColor("#9CA3AF");
            });
        });
    }

    private static void PdfTh(TableCellDescriptor h, string label)
    {
        h.Cell().Background("#CC1416").Padding(5)
            .Text(label).Bold().FontSize(9).FontColor("#FFFFFF");
    }

    private static void PdfTd(TableDescriptor t, string value, string bg)
    {
        t.Cell().Background(bg).BorderBottom(0.5f).BorderColor("#E5E7EB").Padding(4)
            .Text(value).FontSize(8.5f);
    }

    // ─── Labels ───────────────────────────────────────────────────────────────

    private static string NatureLabel(NatureIntervention n) => n switch
    {
        NatureIntervention.Panne                  => "Panne",
        NatureIntervention.MaintenancePreventive  => "Maintenance préventive",
        NatureIntervention.MaintenanceCurative    => "Maintenance curative",
        NatureIntervention.Installation           => "Installation",
        NatureIntervention.FormationUtilisateur   => "Formation",
        NatureIntervention.DeplacementTechnique   => "Déplacement technique",
        NatureIntervention.Autre                  => "Autre",
        _                                         => n.ToString(),
    };

    private static string StatutLabel(StatutIntervention s) => s switch
    {
        StatutIntervention.Ouverte  => "Ouverte",
        StatutIntervention.EnCours  => "En cours",
        StatutIntervention.Resolue  => "Résolue",
        StatutIntervention.Fermee   => "Fermée",
        _                           => s.ToString(),
    };

    private static string ContratLabel(StatutContrat s) => s switch
    {
        StatutContrat.Actif    => "Actif",
        StatutContrat.Expire   => "Expiré",
        StatutContrat.Suspendu => "Suspendu",
        StatutContrat.Resilie  => "Résilié",
        _                      => s.ToString(),
    };

    private static string SituationLabel(StatutCopieur s) => s switch
    {
        StatutCopieur.Actif          => "Actif",
        StatutCopieur.EnMaintenance  => "En maintenance",
        StatutCopieur.Remplace       => "Remplacé",
        StatutCopieur.HorsService    => "Hors service",
        _                            => s.ToString(),
    };
}
