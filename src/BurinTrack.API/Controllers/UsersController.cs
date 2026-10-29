using BurinTrack.Application.DTOs;
using BurinTrack.Domain.Entities;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private static readonly HashSet<string> AllowedRoles =
        ["Administrateur", "ResponsableSAV", "Technicien", "Consultation"];

    private readonly UserManager<IdentityUser> _userManager;
    private readonly BurinTrackDbContext _db;

    public UsersController(UserManager<IdentityUser> userManager, BurinTrackDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    [HttpGet]
    [Authorize(Policy = "CanViewAll")]
    public async Task<ActionResult<IEnumerable<UserListDto>>> GetAll()
    {
        var users = await _userManager.Users.AsNoTracking().ToListAsync();
        var result = new List<UserListDto>();
        foreach (var u in users.OrderBy(u => u.UserName))
        {
            var roles = await _userManager.GetRolesAsync(u);
            var isLocked = u.LockoutEnd.HasValue && u.LockoutEnd > DateTimeOffset.UtcNow;
            result.Add(new UserListDto(u.Id, u.Email!, u.UserName!, roles.FirstOrDefault() ?? "", isLocked));
        }
        return Ok(result);
    }

    [HttpGet("me")]
    public async Task<ActionResult<UserInfoDto>> GetMe()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null) return Unauthorized();
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();
        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new UserInfoDto(user.Id, user.Email!, user.UserName!, roles));
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<UserListDto>> CreateUser([FromBody] CreateUserDto dto)
    {
        if (!AllowedRoles.Contains(dto.Role))
            return BadRequest("Role invalide.");

        var user = new IdentityUser
        {
            UserName = $"{dto.Prenom} {dto.Nom}".Trim(),
            Email = dto.Email,
            EmailConfirmed = true
        };
        var result = await _userManager.CreateAsync(user, dto.MotDePasse);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, dto.Role);

        if (dto.Role == "Technicien")
        {
            if (!await _db.Techniciens.AnyAsync(t => t.Email == dto.Email))
            {
                _db.Techniciens.Add(new Technicien
                {
                    UserId = user.Id,
                    Nom = dto.Nom,
                    Prenom = dto.Prenom,
                    Telephone = dto.Telephone,
                    Email = dto.Email,
                    EstActif = true
                });
                await _db.SaveChangesAsync();
            }
        }

        return Created($"/api/users/{user.Id}",
            new UserListDto(user.Id, user.Email!, user.UserName!, dto.Role, false));
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null) return Unauthorized();
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        if (user.Email != dto.Email)
        {
            var token = await _userManager.GenerateChangeEmailTokenAsync(user, dto.Email);
            var emailResult = await _userManager.ChangeEmailAsync(user, dto.Email, token);
            if (!emailResult.Succeeded) return BadRequest(emailResult.Errors);
        }
        user.UserName = dto.NomComplet;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPut("me/password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is null) return Unauthorized();
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, dto.AncienMotDePasse, dto.NouveauMotDePasse);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
    {
        if (!AllowedRoles.Contains(dto.Role))
            return BadRequest("Role invalide.");

        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        if (user.Email != dto.Email)
        {
            var token = await _userManager.GenerateChangeEmailTokenAsync(user, dto.Email);
            var r = await _userManager.ChangeEmailAsync(user, dto.Email, token);
            if (!r.Succeeded) return BadRequest(r.Errors);
        }
        user.UserName = dto.NomComplet;
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded) return BadRequest(updateResult.Errors);

        var currentRoles = await _userManager.GetRolesAsync(user);
        var previousRole = currentRoles.FirstOrDefault() ?? "";
        if (!currentRoles.Contains(dto.Role))
        {
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
        }

        await SyncTechnicienAsync(id, dto.NomComplet, dto.Email, dto.Role, previousRole);

        return NoContent();
    }

    [HttpPut("{id}/reset-password")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordDto dto)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, dto.NouveauMotDePasse);
        if (!result.Succeeded) return BadRequest(result.Errors);
        return NoContent();
    }

    [HttpPut("{id}/toggle")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Toggle(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null) return NotFound();

        var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (user.Id == currentUserId) return BadRequest("Vous ne pouvez pas désactiver votre propre compte.");

        var isLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow;
        if (isLocked)
        {
            user.LockoutEnd = null;
        }
        else
        {
            user.LockoutEnabled = true;
            user.LockoutEnd = DateTimeOffset.UtcNow.AddYears(99);
        }
        await _userManager.UpdateAsync(user);

        var technicien = await _db.Techniciens.FirstOrDefaultAsync(t => t.UserId == id);
        if (technicien != null)
        {
            technicien.EstActif = isLocked; // was locked → now active; was active → now locked
            await _db.SaveChangesAsync();
        }

        return NoContent();
    }

    private async Task SyncTechnicienAsync(string userId, string nomComplet, string email, string newRole, string previousRole)
    {
        var technicien = await _db.Techniciens.FirstOrDefaultAsync(t => t.UserId == userId);

        if (newRole == "Technicien")
        {
            if (technicien == null)
            {
                var parts = nomComplet.Split(' ', 2);
                _db.Techniciens.Add(new Technicien
                {
                    UserId = userId,
                    Prenom = parts[0],
                    Nom = parts.Length > 1 ? parts[1] : "",
                    Telephone = "",
                    Email = email,
                    EstActif = true
                });
            }
            else
            {
                technicien.Email = email;
                technicien.EstActif = true;
            }
        }
        else if (previousRole == "Technicien" && technicien != null)
        {
            technicien.EstActif = false;
        }

        await _db.SaveChangesAsync();
    }
}
