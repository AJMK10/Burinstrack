namespace BurinTrack.Application.Interfaces;

public interface IEmailService
{
    Task EnvoyerAsync(string destinataire, string sujet, string corps, CancellationToken ct = default);
    Task EnvoyerNotificationInterventionAsync(Guid interventionId, string typeEvenement, CancellationToken ct = default);
}
