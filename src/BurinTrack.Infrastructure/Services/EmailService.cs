using BurinTrack.Application.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace BurinTrack.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config) => _config = config;

    public async Task EnvoyerAsync(string destinataire, string sujet, string corps, CancellationToken ct = default)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(_config["Email:De"]));
        message.To.Add(MailboxAddress.Parse(destinataire));
        message.Subject = sujet;
        message.Body = new TextPart("html") { Text = corps };

        using var client = new SmtpClient();
        await client.ConnectAsync(_config["Email:Smtp"], int.Parse(_config["Email:Port"]!),
            SecureSocketOptions.StartTls, ct);
        await client.AuthenticateAsync(_config["Email:Utilisateur"], _config["Email:MotDePasse"], ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }

    public Task EnvoyerNotificationInterventionAsync(Guid interventionId, string typeEvenement, CancellationToken ct = default)
    {
        // TODO: charger l'intervention et envoyer l'email approprié selon typeEvenement
        return Task.CompletedTask;
    }
}
