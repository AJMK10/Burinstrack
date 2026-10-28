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
        var refreshToken = _tokenService.GenererRefreshToken();

        // Stocker le refresh token hashé
        await _userManager.SetAuthenticationTokenAsync(user, "BurinTrack", "RefreshToken", refreshToken);

        var expiration = DateTime.UtcNow.AddMinutes(15);
        return Ok(new TokenDto(accessToken, refreshToken, expiration,
            new UserInfoDto(user.Id, user.Email!, user.UserName!, roles)));
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<TokenDto>> Refresh([FromBody] RefreshTokenDto dto)
    {
        // Trouver le user par son refresh token
        var users = _userManager.Users.ToList();
        IdentityUser? user = null;
        foreach (var u in users)
        {
            var stored = await _userManager.GetAuthenticationTokenAsync(u, "BurinTrack", "RefreshToken");
            if (stored == dto.RefreshToken) { user = u; break; }
        }

        if (user is null) return Unauthorized("Refresh token invalide.");

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = _tokenService.GenererAccessToken(user.Id, user.Email!, roles);
        var newRefreshToken = _tokenService.GenererRefreshToken();
        await _userManager.SetAuthenticationTokenAsync(user, "BurinTrack", "RefreshToken", newRefreshToken);

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
        var user = new IdentityUser { Email = dto.Email, UserName = dto.Email };
        var result = await _userManager.CreateAsync(user, dto.MotDePasse);
        if (!result.Succeeded) return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, dto.Role);
        return Created($"/api/auth/users/{user.Id}", new { user.Id, user.Email });
    }
}
