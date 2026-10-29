using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;
using FluentAssertions;

namespace BurinTrack.Tests.Domain;

public class CopieurTests
{
    [Fact]
    public void Copieur_ContratActif_ShouldBeTrueWhenDateFinIsInFuture()
    {
        var copieur = new Copieur
        {
            DateDebutContrat = DateTime.UtcNow.AddYears(-1),
            DateFinContrat = DateTime.UtcNow.AddYears(1),
            StatutContrat = StatutContrat.Actif
        };

        copieur.StatutContrat.Should().Be(StatutContrat.Actif);
        copieur.DateFinContrat.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public void Copieur_ContratExpire_ShouldBeExpiredWhenDateFinIsPast()
    {
        var copieur = new Copieur
        {
            DateDebutContrat = DateTime.UtcNow.AddYears(-3),
            DateFinContrat = DateTime.UtcNow.AddDays(-1),
            StatutContrat = StatutContrat.Expire
        };

        copieur.StatutContrat.Should().Be(StatutContrat.Expire);
        copieur.DateFinContrat.Should().BeBefore(DateTime.UtcNow);
    }

    [Fact]
    public void Copieur_NumeroSerie_ShouldBeSet()
    {
        var serial = "MX-2024-ABC123";
        var copieur = new Copieur { NumeroSerie = serial };

        copieur.NumeroSerie.Should().Be(serial);
    }
}
