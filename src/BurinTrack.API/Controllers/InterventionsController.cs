using BurinTrack.Application.DTOs;
using BurinTrack.Application.Interfaces;
using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/interventions")]
[Authorize(Policy = "CanViewAll")]
public class InterventionsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public InterventionsController(IUnitOfWork uow) => _uow = uow;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InterventionDto>>> Search(
        [FromQuery] Guid? clientId,
        [FromQuery] Guid? copieurId,
        [FromQuery] Guid? technicienId,
        [FromQuery] StatutIntervention? statut,
        [FromQuery] DateTime? du,
        [FromQuery] DateTime? au,
        [FromQuery] int page = 1,
        [FromQuery] int taille = 20,
        CancellationToken ct = default)
    {
        var interventions = await _uow.Interventions.SearchAsync(
            clientId, copieurId, technicienId, statut, du, au, page, taille, ct);
        return Ok(interventions.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InterventionDto>> GetById(Guid id, CancellationToken ct)
    {
        var intervention = await _uow.Interventions.GetDetailAsync(id, ct);
        if (intervention is null) return NotFound();
        return Ok(MapToDto(intervention));
    }

    [HttpPost]
    [Authorize(Policy = "CanCreateIntervention")]
    public async Task<ActionResult<InterventionDto>> Create([FromBody] CreateInterventionDto dto, CancellationToken ct)
    {
        var numero = await _uow.Interventions.GenererNumeroInterventionAsync(ct);

        var intervention = new Intervention
        {
            NumeroIntervention = numero,
            DateIntervention = dto.DateIntervention,
            ClientId = dto.ClientId,
            CopieurId = dto.CopieurId,
            TechnicienId = dto.TechnicienId,
            CompteurNBPrecedent = dto.CompteurNBPrecedent,
            CompteurNBActuel = dto.CompteurNBActuel,
            CompteurCouleurPrecedent = dto.CompteurCouleurPrecedent,
            CompteurCouleurActuel = dto.CompteurCouleurActuel,
            Nature = dto.Nature,
            DescriptionProbleme = dto.DescriptionProbleme,
            ActionsRealisees = dto.ActionsRealisees,
            PiecesRemplacees = dto.PiecesRemplacees,
            HeureArrivee = dto.HeureArrivee,
            HeureDepart = dto.HeureDepart,
            ObservationTechnicien = dto.ObservationTechnicien,
            ObservationClient = dto.ObservationClient,
            Statut = StatutIntervention.Ouverte
        };

        await _uow.Interventions.AddAsync(intervention, ct);
        await _uow.SaveChangesAsync(ct);

        var created = await _uow.Interventions.GetDetailAsync(intervention.Id, ct);
        return CreatedAtAction(nameof(GetById), new { id = intervention.Id }, MapToDto(created!));
    }

    [HttpPatch("{id:guid}/statut")]
    [Authorize(Policy = "CanCreateIntervention")]
    public async Task<IActionResult> UpdateStatut(Guid id, [FromBody] UpdateStatutInterventionDto dto, CancellationToken ct)
    {
        var intervention = await _uow.Interventions.GetByIdAsync(id, ct);
        if (intervention is null) return NotFound();

        intervention.Statut = dto.Statut;
        if (dto.ObservationTechnicien is not null)
            intervention.ObservationTechnicien = dto.ObservationTechnicien;
        if (dto.ObservationClient is not null)
            intervention.ObservationClient = dto.ObservationClient;

        await _uow.Interventions.UpdateAsync(intervention, ct);
        await _uow.SaveChangesAsync(ct);
        return NoContent();
    }

    private static InterventionDto MapToDto(Intervention i) => new(
        i.Id, i.NumeroIntervention, i.DateIntervention,
        i.ClientId, i.Client?.NomClient ?? "",
        i.CopieurId, i.Copieur?.Designation ?? "", i.Copieur?.NumeroSerie ?? "",
        i.TechnicienId, $"{i.Technicien?.Prenom} {i.Technicien?.Nom}".Trim(),
        i.CompteurNBPrecedent, i.CompteurNBActuel,
        i.CompteurCouleurPrecedent, i.CompteurCouleurActuel,
        i.VolumeNBConsomme, i.VolumeCouleurConsomme,
        i.Nature, i.DescriptionProbleme, i.ActionsRealisees, i.PiecesRemplacees,
        i.HeureArrivee, i.HeureDepart,
        i.ObservationTechnicien, i.ObservationClient,
        i.Statut, i.CreatedAt);
}
