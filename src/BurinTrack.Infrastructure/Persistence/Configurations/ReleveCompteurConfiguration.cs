using BurinTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurinTrack.Infrastructure.Persistence.Configurations;

public class ReleveCompteurConfiguration : IEntityTypeConfiguration<ReleveCompteur>
{
    public void Configure(EntityTypeBuilder<ReleveCompteur> builder)
    {
        builder.ToTable("Releves");
        builder.HasKey(r => r.Id);
        builder.HasIndex(r => new { r.CopieurId, r.Annee, r.Mois }).IsUnique();
        builder.HasOne(r => r.Copieur)
               .WithMany(c => c.Releves)
               .HasForeignKey(r => r.CopieurId)
               .OnDelete(DeleteBehavior.Cascade);
        builder.Ignore(r => r.CopiesMonoA4Eq);
        builder.Ignore(r => r.CopiesCoulA4Eq);
    }
}
