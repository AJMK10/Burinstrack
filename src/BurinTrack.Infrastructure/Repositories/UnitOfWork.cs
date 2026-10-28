using BurinTrack.Application.Interfaces;
using BurinTrack.Infrastructure.Persistence;

namespace BurinTrack.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly BurinTrackDbContext _db;

    public IClientRepository Clients { get; }
    public ICopieurRepository Copieurs { get; }
    public IInterventionRepository Interventions { get; }

    public UnitOfWork(BurinTrackDbContext db)
    {
        _db = db;
        Clients = new ClientRepository(db);
        Copieurs = new CopieurRepository(db);
        Interventions = new InterventionRepository(db);
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _db.SaveChangesAsync(ct);

    public void Dispose() => _db.Dispose();
}
