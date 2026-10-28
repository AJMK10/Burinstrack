using System.Security.Claims;
using BurinTrack.Application.Interfaces;

namespace BurinTrack.API.Middleware;

public class AuditMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly HashSet<string> _methodsAudites = ["POST", "PUT", "PATCH", "DELETE"];

    public AuditMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, IAuditService auditService)
    {
        await _next(context);

        if (!_methodsAudites.Contains(context.Request.Method)) return;
        if (context.Response.StatusCode < 200 || context.Response.StatusCode >= 300) return;
        if (!context.User.Identity?.IsAuthenticated ?? true) return;

        var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        var email = context.User.FindFirstValue(ClaimTypes.Email) ?? "";
        var ip = context.Connection.RemoteIpAddress?.ToString();

        await auditService.LogAsync(
            userId, email,
            context.Request.Method,
            context.Request.Path,
            "",
            ip: ip);
    }
}
