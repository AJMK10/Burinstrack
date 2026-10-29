using BurinTrack.Application.DTOs;
using BurinTrack.Application.Interfaces;
using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize(Policy = "CanViewAll")]
public class ClientsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public ClientsController(IUnitOfWork uow) => _uow = uow;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClientDto>>> GetAll(
        [FromQuery] string? search, [FromQuery] string? ville, CancellationToken ct)
    {
        var clients = await _uow.Clients.SearchAsync(search, ville, ct);
        return Ok(clients.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientDto>> GetById(Guid id, CancellationToken ct)
    {
        var client = await _uow.Clients.GetWithCopieursByIdAsync(id, ct);
        if (client is null) return NotFound();
        return Ok(MapToDto(client));
    }

    [HttpPost]
    [Authorize(Policy = "CanManageClients")]
    public async Task<ActionResult<ClientDto>> Create([FromBody] CreateClientDto dto, CancellationToken ct)
    {
        if (await _uow.Clients.NumeroContratExisteAsync(dto.NumeroContrat, ct: ct))
            return Conflict($"Le numéro de contrat '{dto.NumeroContrat}' existe déjà.");

        var client = new Client
        {
            NomClient = dto.NomClient,
            RaisonSociale = dto.RaisonSociale,
            NumeroContrat = dto.NumeroContrat,
            SecteurActivite = dto.SecteurActivite,
            Adresse = dto.Adresse,
            Ville = dto.Ville,
            Commune = dto.Commune,
            Pays = dto.Pays,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            NomContact = dto.NomContact,
            FonctionContact = dto.FonctionContact,
            Telephone = dto.Telephone,
            Email = dto.Email,
            TypeFacturation = dto.TypeFacturation,
            ForfaitMensuelHT = dto.ForfaitMensuelHT,
            ForfaitCopieMono = dto.ForfaitCopieMono,
            ForfaitCopieCouleur = dto.ForfaitCopieCouleur,
            PrixCopieSupMono = dto.PrixCopieSupMono,
            PrixCopieSupCouleur = dto.PrixCopieSupCouleur,
            TauxTVA = dto.TauxTVA
        };

        await _uow.Clients.AddAsync(client, ct);
        await _uow.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(GetById), new { id = client.Id }, MapToDto(client));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "CanManageClients")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientDto dto, CancellationToken ct)
    {
        var client = await _uow.Clients.GetByIdAsync(id, ct);
        if (client is null) return NotFound();

        client.NomClient = dto.NomClient;
        client.RaisonSociale = dto.RaisonSociale;
        client.SecteurActivite = dto.SecteurActivite;
        client.Adresse = dto.Adresse;
        client.Ville = dto.Ville;
        client.Commune = dto.Commune;
        client.Pays = dto.Pays;
        client.Latitude = dto.Latitude;
        client.Longitude = dto.Longitude;
        client.NomContact = dto.NomContact;
        client.FonctionContact = dto.FonctionContact;
        client.Telephone = dto.Telephone;
        client.Email = dto.Email;
        client.EstActif = dto.EstActif;
        client.TypeFacturation = dto.TypeFacturation;
        client.ForfaitMensuelHT = dto.ForfaitMensuelHT;
        client.ForfaitCopieMono = dto.ForfaitCopieMono;
        client.ForfaitCopieCouleur = dto.ForfaitCopieCouleur;
        client.PrixCopieSupMono = dto.PrixCopieSupMono;
        client.PrixCopieSupCouleur = dto.PrixCopieSupCouleur;
        client.TauxTVA = dto.TauxTVA;

        await _uow.Clients.UpdateAsync(client, ct);
        await _uow.SaveChangesAsync(ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var client = await _uow.Clients.GetByIdAsync(id, ct);
        if (client is null) return NotFound();

        client.EstActif = false;
        await _uow.Clients.UpdateAsync(client, ct);
        await _uow.SaveChangesAsync(ct);
        return NoContent();
    }

    private static ClientDto MapToDto(Client c) => new(
        c.Id, c.NomClient, c.RaisonSociale, c.NumeroContrat, c.SecteurActivite,
        c.Adresse, c.Ville, c.Commune, c.Pays, c.Latitude, c.Longitude,
        c.NomContact, c.FonctionContact, c.Telephone, c.Email,
        c.EstActif, c.TypeFacturation,
        c.ForfaitMensuelHT, c.ForfaitCopieMono, c.ForfaitCopieCouleur,
        c.PrixCopieSupMono, c.PrixCopieSupCouleur, c.TauxTVA,
        c.Copieurs.Count, c.CreatedAt);
}
