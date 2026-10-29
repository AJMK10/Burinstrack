using System.Security.Cryptography;
using System.Text;
using BurinTrack.Application.DTOs;
using BurinTrack.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BurinTrack.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private static readonly HashSet<string> AllowedRoles =
        ["Administrateur", "ResponsableSAV", "Technicien", "Consultation"];

    private readonly UserManager<IdentityUser> _userManager;
    private readonly SignInManager<IdentityUser> _signInManager;
    private readonly ITokenService _tokenService;

    public AuthController(UserManager<IdentityUser> userManager,
        SignInManager<IdentityUser> signInManager, ITokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<TokenDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null) return Unauthorized("Identifiants invalides.");

        var result = await _signInManager.CheckPasswordSignInAsync(user, dto.MotDePasse, lockoutOnFailure: true);
        if (result.IsLockedOut) return Unauthorized("Compte temporairement bloqué.");
        if (!result.Succeeded) return Unauthorized("Identifiants invalides.");

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenererAccessToken(user.Id, user.Email!, roles);
        var refreshToken = _tokenService.GenererRefreshToken(user.Id);

        // Stocker le hash SHA-256 du refresh token + expiration 7 jours
        var tokenHash = HashToken(refreshToken);
        var tokenValue = $"{tokenHash}|{DateTime.UtcNow.AddDays(7):O}";
        await _userManager.SetAuthenticationTokenAsync(user, "BurinTrack", "RefreshToken", tokenValue);

        return Ok(new TokenDto(accessToken, refreshToken, DateTime.UtcNow.AddMinutes(15),
            new UserInfoDto(user.Id, user.Email!, user.UserName!, roles)));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<TokenDto>> Refresh([FromBody] RefreshTokenDto dto)
    {
        // Extraire le userId embarqué dans le token pour éviter le scan O(N)
        string userId;
        try
        {
            var decoded = Encoding.UTF8.GetString(Convert.FromBase64String(dto.RefreshToken));
            userId = decoded.Split(':')[0];
        }
        catch { return Unauthorized("Refresh token invalide."); }

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized("Refresh token invalide.");

        var stored = await _userManager.GetAuthenticationTokenAsync(user, "BurinTrack", "RefreshToken");
        if (stored is null) return Unauthorized("Refresh token invalide.");

        var parts = stored.Split('|');
        if (parts.Length != 2) return Unauthorized("Refresh token invalide.");

        // Vérifier l'expiration
        if (!DateTime.TryParse(parts[1], out var expiry) || DateTime.UtcNow > expiry)
            return Unauthorized("Refresh token expiré. Veuillez vous reconnecter.");

        // Comparaison en temps constant pour éviter les timing attacks
        var incomingHash = HashToken(dto.RefreshToken);
        if (!CryptographicOperations.FixedTimeEquals(
            Convert.FromBase64String(parts[0]),
            Convert.FromBase64String(incomingHash)))
            return Unauthorized("Refresh token invalide.");

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenererAccessToken(user.Id, user.Email!, roles);
        var newRefreshToken = _tokenService.GenererRefreshToken(user.Id);
        var newHash = HashToken(newRefreshToken);
        var newTokenValue = $"{newHash}|{DateTime.UtcNow.AddDays(7):O}";
        await _userManager.SetAuthenticationTokenAsync(user, "BurinTrack", "RefreshToken", newTokenValue);

        return Ok(new TokenDto(accessToken, newRefreshToken, DateTime.UtcNow.AddMinutes(15),
            new UserInfoDto(user.Id, user.Email!, user.UserName!, roles)));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId is not null)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is not null)
                await _userManager.RemoveAuthenticationTokenAsync(user, "BurinTrack", "RefreshToken");
        }
        return NoContent();
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("users")]
    public async Task<ActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        if (!AllowedRoles.Contains(dto.Role))
            return BadRequest($"Role invalide. Roles autorisés: {string.Join(", ", AllowedRoles)}");

        var user = new IdentityUser { Email = dto.Email, UserName = $"{dto.Prenom} {dto.Nom}".Trim() };
        var result = await _userManager.CreateAsync(user, dto.MotDePasse);
        if (!result.Succeeded)
            return BadRequest(string.Join(" ", result.Errors.Select(e => e.Description)));

        await _userManager.AddToRoleAsync(user, dto.Role);
        return Created($"/api/auth/users/{user.Id}", new { user.Id, user.Email });
    }

    private static string HashToken(string token)
        => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
