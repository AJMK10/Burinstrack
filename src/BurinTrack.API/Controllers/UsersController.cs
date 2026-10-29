using BurinTrack.Application.DTOs;
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

    public UsersController(UserManager<IdentityUser> userManager)
        => _userManager = userManager;

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
        if (!currentRoles.Contains(dto.Role))
        {
            await _userManager.RemoveFromRolesAsync(user, currentRoles);
            await _userManager.AddToRoleAsync(user, dto.Role);
        }
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
        return NoContent();
    }
}
