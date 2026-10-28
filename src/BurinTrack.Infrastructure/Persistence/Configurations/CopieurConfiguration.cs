using BurinTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurinTrack.Infrastructure.Persistence.Configurations;

public class CopieurConfiguration : IEntityTypeConfiguration<Copieur>
{
    public void Configure(EntityTypeBuilder<Copieur> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.NumeroSerie).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Marque).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Modele).IsRequired().HasMaxLength(100);
        builder.Property(c => c.Designation).HasMaxLength(200);
        builder.Property(c => c.AdresseIP).HasMaxLength(45);

        builder.HasIndex(c => c.NumeroSerie).IsUnique();
        builder.HasIndex(c => c.ClientId);
        builder.HasIndex(c => c.DateFinContrat);
        builder.HasIndex(c => c.Situation);

        builder.HasMany(c => c.Interventions)
            .WithOne(i => i.Copieur)
            .HasForeignKey(i => i.CopieurId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
