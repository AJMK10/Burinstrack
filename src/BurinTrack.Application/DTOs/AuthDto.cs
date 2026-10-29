using System.ComponentModel.DataAnnotations;

namespace BurinTrack.Application.DTOs;

public record LoginDto(
    [Required, EmailAddress, StringLength(256)] string Email,
    [Required, StringLength(128, MinimumLength = 12)] string MotDePasse
);

public record TokenDto(string AccessToken, string RefreshToken, DateTime Expiration, UserInfoDto User);

public record RefreshTokenDto(
    [Required] string RefreshToken
);

public record UserInfoDto(string Id, string Email, string NomComplet, IList<string> Roles);

public record CreateUserDto(
    [Required, EmailAddress, StringLength(256)] string Email,
    [Required, StringLength(128, MinimumLength = 12)] string MotDePasse,
    [Required, StringLength(100)] string Nom,
    [Required, StringLength(100)] string Prenom,
    [Required, StringLength(30)] string Telephone,
    [Required, StringLength(50)] string Role
);

public record ChangePasswordDto(
    [Required] string AncienMotDePasse,
    [Required, StringLength(128, MinimumLength = 12)] string NouveauMotDePasse
);

public record UserListDto(
    string Id,
    string Email,
    string NomComplet,
    string Role,
    bool IsLocked
);

public record UpdateUserDto(
    [Required, StringLength(200)] string NomComplet,
    [Required, EmailAddress, StringLength(256)] string Email,
    [Required, StringLength(50)] string Role
);

public record ResetPasswordDto(
    [Required, StringLength(128, MinimumLength = 12)] string NouveauMotDePasse
);

public record UpdateProfileDto(
    [Required, StringLength(200)] string NomComplet,
    [Required, EmailAddress, StringLength(256)] string Email
);
