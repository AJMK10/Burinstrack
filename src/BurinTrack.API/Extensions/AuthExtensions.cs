using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace BurinTrack.API.Extensions;

public static class AuthExtensions
{
    public static IServiceCollection AddJwtAuth(this IServiceCollection services, IConfiguration config)
    {
        services.AddAuthentication(opts =>
            {
                opts.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                opts.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(opts =>
            {
                opts.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = config["Jwt:Issuer"],
                    ValidAudience = config["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(config["Jwt:Secret"]!)),
                    ClockSkew = TimeSpan.Zero
                };
            });

        services.AddAuthorization(opts =>
        {
            opts.AddPolicy("AdminOnly", p => p.RequireRole("Administrateur"));
            opts.AddPolicy("CanManageClients", p => p.RequireRole("Administrateur", "ResponsableSAV"));
            opts.AddPolicy("CanAssignInterventions", p => p.RequireRole("Administrateur", "ResponsableSAV"));
            opts.AddPolicy("CanCreateIntervention", p => p.RequireRole("Administrateur", "ResponsableSAV", "Technicien"));
            opts.AddPolicy("CanManageReleves", p => p.RequireRole("Administrateur", "ResponsableSAV", "Technicien"));
            opts.AddPolicy("CanViewAll", p => p.RequireAuthenticatedUser());
        });

        return services;
    }
}
