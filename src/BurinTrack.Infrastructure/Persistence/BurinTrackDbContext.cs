using BurinTrack.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.Infrastructure.Persistence;

public class BurinTrackDbContext : IdentityDbContext<IdentityUser>
{
    public BurinTrackDbContext(DbContextOptions<BurinTrackDbContext> options) : base(options) { }

    public DbSet<Client> Clients => Set<Client>();
    public DbSet<Copieur> Copieurs => Set<Copieur>();
    public DbSet<Technicien> Techniciens => Set<Technicien>();
    public DbSet<Intervention> Interventions => Set<Intervention>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ReleveCompteur> Releves => Set<ReleveCompteur>();
    public DbSet<Parametre> Parametres => Set<Parametre>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(BurinTrackDbContext).Assembly);

        // Renommer les tables Identity pour plus de lisibilité
        builder.Entity<IdentityUser>().ToTable("Users");
        builder.Entity<IdentityRole>().ToTable("Roles");
        builder.Entity<IdentityUserRole<string>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<string>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<string>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<string>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<string>>().ToTable("UserTokens");

        builder.Entity<Parametre>(e =>
        {
            e.HasKey(p => p.Cle);
            e.HasData(
                new Parametre { Cle = "entreprise", Valeur = "{\"nomSociete\":\"BURINFORT\",\"nomApplication\":\"BurinTrack\",\"adresse\":\"\",\"telephone\":\"\",\"email\":\"\",\"siteWeb\":\"\",\"logoBase64\":\"\"}", UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Parametre { Cle = "smtp", Valeur = "{\"hote\":\"\",\"port\":587,\"utilisateur\":\"\",\"motDePasse\":\"\",\"expediteur\":\"noreply@burinfort.com\",\"ssl\":true}", UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Parametre { Cle = "alertes", Valeur = "{\"seuilJours1\":30,\"seuilJours2\":60,\"envoyerAutoAuDemarrage\":false}", UpdatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Domain.Common.BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
