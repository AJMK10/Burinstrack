using BurinTrack.Application.Interfaces;
using BurinTrack.Infrastructure.Persistence;
using BurinTrack.Infrastructure.Repositories;
using BurinTrack.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Minio;

namespace BurinTrack.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<BurinTrackDbContext>(opts =>
            opts.UseNpgsql(config.GetConnectionString("DefaultConnection"),
                o => o.MigrationsAssembly(typeof(BurinTrackDbContext).Assembly.FullName)));

        services.AddIdentity<IdentityUser, IdentityRole>(opts =>
            {
                opts.Password.RequiredLength = 12;
                opts.Password.RequireNonAlphanumeric = true;
                opts.Password.RequireDigit = true;
                opts.Password.RequireUppercase = true;
                opts.Password.RequireLowercase = true;
                opts.Password.RequiredUniqueChars = 4;
                opts.Lockout.MaxFailedAccessAttempts = 5;
                opts.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                opts.User.AllowedUserNameCharacters =
                    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_.'@àâäéèêëîïôùûüçÀÂÄÉÈÊËÎÏÔÙÛÜÇ";
            })
            .AddEntityFrameworkStores<BurinTrackDbContext>()
            .AddDefaultTokenProviders();

        services.AddStackExchangeRedisCache(opts =>
            opts.Configuration = config.GetConnectionString("Redis"));

        services.AddMinio(opts =>
        {
            opts.WithEndpoint(config["MinIO:Endpoint"] ?? "minio:9000")
                .WithCredentials(
                    config["MinIO:AccessKey"] ?? string.Empty,
                    config["MinIO:SecretKey"] ?? string.Empty)
                .WithSSL(config.GetValue<bool>("MinIO:Secure"));
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IStorageService, MinioStorageService>();

        return services;
    }
}
