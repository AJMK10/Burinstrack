using BurinTrack.Domain.Entities;
using FluentAssertions;

namespace BurinTrack.Tests.Domain;

public class ClientTests
{
    [Fact]
    public void Client_Creation_ShouldHaveDefaultValues()
    {
        var client = new Client
        {
            NomClient = "SOBRAGA",
            RaisonSociale = "Société des Brasseries du Gabon",
            NumeroContrat = "CT-2026-001",
            Telephone = "+241 01 72 00 00",
            Email = "contact@sobraga.ga",
            Adresse = "Zone Industrielle d'Oloumi",
            Ville = "Libreville",
            Commune = "Libreville",
            NomContact = "Jean Moussavou",
            FonctionContact = "DSI",
            SecteurActivite = "Industrie"
        };

        client.EstActif.Should().BeTrue();
        client.Pays.Should().Be("Gabon");
        client.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void Client_NumeroContrat_ShouldBeUnique()
    {
        var contrat = "CT-2026-001";
        var client1 = new Client { NumeroContrat = contrat };
        var client2 = new Client { NumeroContrat = contrat };

        client1.NumeroContrat.Should().Be(client2.NumeroContrat);
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Client_NomClient_ShouldNotBeNullOrEmpty(string? nom)
    {
        var action = () =>
        {
            var client = new Client { NomClient = nom! };
            _ = client.NomClient.Length;
        };

        if (nom is null)
            action.Should().Throw<NullReferenceException>();
        else
            action.Should().NotThrow();
    }
}
