using BurinTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurinTrack.Infrastructure.Persistence.Configurations;

public class InterventionConfiguration : IEntityTypeConfiguration<Intervention>
{
    public void Configure(EntityTypeBuilder<Intervention> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.NumeroIntervention).IsRequired().HasMaxLength(20);
        builder.Property(i => i.DescriptionProbleme).HasMaxLength(2000);
        builder.Property(i => i.ActionsRealisees).HasMaxLength(2000);
        builder.Property(i => i.PiecesRemplacees).HasMaxLength(1000);
        builder.Property(i => i.ObservationTechnicien).HasMaxLength(1000);
        builder.Property(i => i.ObservationClient).HasMaxLength(1000);

        builder.HasIndex(i => i.NumeroIntervention).IsUnique();
        builder.HasIndex(i => i.ClientId);
        builder.HasIndex(i => i.CopieurId);
        builder.HasIndex(i => i.TechnicienId);
        builder.HasIndex(i => i.Statut);
        builder.HasIndex(i => i.DateIntervention);

        // VolumeNBConsomme et VolumeCouleurConsomme sont des propriétés calculées, pas stockées
        builder.Ignore(i => i.VolumeNBConsomme);
        builder.Ignore(i => i.VolumeCouleurConsomme);
    }
}
