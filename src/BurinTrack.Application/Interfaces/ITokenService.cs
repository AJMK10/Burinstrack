namespace BurinTrack.Application.Interfaces;

public interface ITokenService
{
    string GenererAccessToken(string userId, string email, IList<string> roles);
    string GenererRefreshToken();
    (string userId, string email)? ValiderRefreshToken(string token);
}
