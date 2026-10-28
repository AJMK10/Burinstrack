using BurinTrack.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BurinTrack.Infrastructure.Persistence.Configurations;

public class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.NomClient).IsRequired().HasMaxLength(200);
        builder.Property(c => c.RaisonSociale).HasMaxLength(200);
        builder.Property(c => c.NumeroContrat).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Email).HasMaxLength(200);
        builder.Property(c => c.Telephone).HasMaxLength(30);
        builder.Property(c => c.Pays).HasMaxLength(100).HasDefaultValue("Gabon");

        builder.HasIndex(c => c.NumeroContrat).IsUnique();

        builder.HasMany(c => c.Copieurs)
            .WithOne(co => co.Client)
            .HasForeignKey(co => co.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Documents)
            .WithOne(d => d.Client)
            .HasForeignKey(d => d.ClientId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
