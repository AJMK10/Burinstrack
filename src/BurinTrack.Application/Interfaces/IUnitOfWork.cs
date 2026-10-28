namespace BurinTrack.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IClientRepository Clients { get; }
    ICopieurRepository Copieurs { get; }
    IInterventionRepository Interventions { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
