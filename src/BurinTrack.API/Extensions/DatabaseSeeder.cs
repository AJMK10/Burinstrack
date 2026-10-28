using BurinTrack.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.API.Extensions;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BurinTrackDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        await db.Database.MigrateAsync();

        // Créer les rôles
        string[] roles = ["Administrateur", "ResponsableSAV", "Technicien", "Consultation"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }

        // Créer l'admin par défaut si aucun utilisateur n'existe
        if (!userManager.Users.Any())
        {
            var admin = new IdentityUser
            {
                UserName = "admin@burinfort.com",
                Email = "admin@burinfort.com",
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin@2026!");
            if (result.Succeeded)
                await userManager.AddToRoleAsync(admin, "Administrateur");
        }
    }
}
