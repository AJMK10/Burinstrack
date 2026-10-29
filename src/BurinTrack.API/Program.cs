using AspNetCoreRateLimit;
using BurinTrack.API.Extensions;
using BurinTrack.API.Middleware;
using BurinTrack.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .WriteTo.Console()
    .WriteTo.File("logs/burintrack-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(
        new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddJwtAuth(builder.Configuration);
builder.Services.AddSwaggerWithAuth();

builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("RateLimit"));
builder.Services.AddInMemoryRateLimiting();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

var allowedOrigins = (builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(opts =>
    opts.AddPolicy("WebPolicy", p => p
        .WithOrigins(allowedOrigins)
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseIpRateLimiting();
app.UseCors("WebPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuditMiddleware>();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Seeder avec retry — tolère une base temporairement inaccessible au démarrage
var seederLogger = app.Services.GetRequiredService<ILogger<Program>>();
for (int attempt = 1; attempt <= 5; attempt++)
{
    try
    {
        await DatabaseSeeder.SeedAsync(app.Services);
        if (app.Environment.IsDevelopment())
            await DemoDataSeeder.SeedAsync(app.Services);
        break;
    }
    catch (Exception ex) when (attempt < 5)
    {
        seederLogger.LogWarning(ex, "Seeder tentative {Attempt}/5 échouée, retry dans 5s", attempt);
        await Task.Delay(TimeSpan.FromSeconds(5));
    }
    catch (Exception ex)
    {
        seederLogger.LogError(ex, "Seeder échoué après 5 tentatives — l'API démarre sans migration");
    }
}

app.Run();
