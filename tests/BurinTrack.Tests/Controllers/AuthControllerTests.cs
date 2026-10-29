using BurinTrack.Application.DTOs;
using BurinTrack.Application.Interfaces;
using BurinTrack.API.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace BurinTrack.Tests.Controllers;

public class AuthControllerTests
{
    private readonly Mock<UserManager<IdentityUser>> _userManagerMock;
    private readonly Mock<SignInManager<IdentityUser>> _signInManagerMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        var store = new Mock<IUserStore<IdentityUser>>();
        _userManagerMock = new Mock<UserManager<IdentityUser>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var contextAccessor = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var claimsFactory = new Mock<IUserClaimsPrincipalFactory<IdentityUser>>();
        _signInManagerMock = new Mock<SignInManager<IdentityUser>>(
            _userManagerMock.Object, contextAccessor.Object,
            claimsFactory.Object, null!, null!, null!, null!);

        _tokenServiceMock = new Mock<ITokenService>();
        _controller = new AuthController(
            _userManagerMock.Object,
            _signInManagerMock.Object,
            _tokenServiceMock.Object);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkWithTokens()
    {
        var user = new IdentityUser { Id = "user-1", Email = "admin@burinfort.com", UserName = "admin" };
        var dto = new LoginDto("admin@burinfort.com", "Admin@2026!");

        _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(user);
        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, dto.MotDePasse, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _userManagerMock.Setup(x => x.GetRolesAsync(user))
            .ReturnsAsync(new List<string> { "Administrateur" });
        _userManagerMock.Setup(x => x.SetAuthenticationTokenAsync(user, "BurinTrack", "RefreshToken", It.IsAny<string>()))
            .ReturnsAsync(IdentityResult.Success);

        _tokenServiceMock.Setup(x => x.GenererAccessToken(user.Id, user.Email!, It.IsAny<IList<string>>()))
            .Returns("access-token-fake");
        _tokenServiceMock.Setup(x => x.GenererRefreshToken(It.IsAny<string>()))
            .Returns("refresh-token-fake");

        var result = await _controller.Login(dto);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var token = ok.Value.Should().BeOfType<TokenDto>().Subject;
        token.AccessToken.Should().Be("access-token-fake");
        token.RefreshToken.Should().Be("refresh-token-fake");
    }

    [Fact]
    public async Task Login_WithInvalidEmail_ReturnsUnauthorized()
    {
        var dto = new LoginDto("inconnu@burinfort.com", "WrongPassword");
        _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync((IdentityUser?)null);

        var result = await _controller.Login(dto);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_WithLockedAccount_ReturnsUnauthorized()
    {
        var user = new IdentityUser { Id = "user-1", Email = "bloque@burinfort.com" };
        var dto = new LoginDto("bloque@burinfort.com", "password");

        _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(user);
        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, dto.MotDePasse, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.LockedOut);

        var result = await _controller.Login(dto);

        var unauthorized = result.Result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        unauthorized.Value.Should().Be("Compte temporairement bloqué.");
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        var user = new IdentityUser { Id = "user-1", Email = "admin@burinfort.com" };
        var dto = new LoginDto("admin@burinfort.com", "MauvaisMotDePasse");

        _userManagerMock.Setup(x => x.FindByEmailAsync(dto.Email)).ReturnsAsync(user);
        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, dto.MotDePasse, true))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Failed);

        var result = await _controller.Login(dto);

        result.Result.Should().BeOfType<UnauthorizedObjectResult>();
    }
}
