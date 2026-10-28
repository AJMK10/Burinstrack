namespace BurinTrack.Application.DTOs;

public record LoginDto(string Email, string MotDePasse);

public record TokenDto(string AccessToken, string RefreshToken, DateTime Expiration, UserInfoDto User);

public record RefreshTokenDto(string RefreshToken);

public record UserInfoDto(string Id, string Email, string NomComplet, IList<string> Roles);

public record CreateUserDto(
    string Email,
    string MotDePasse,
    string Nom,
    string Prenom,
    string Telephone,
    string Role
);

public record ChangePasswordDto(string AncienMotDePasse, string NouveauMotDePasse);
