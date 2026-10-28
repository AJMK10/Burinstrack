using BurinTrack.Domain.Common;

namespace BurinTrack.Domain.Entities;

public class ReleveCompteur : BaseEntity
{
    public Guid CopieurId { get; set; }
    public int Annee { get; set; }
    public int Mois { get; set; }

    public long A3MonoDebut { get; set; }
    public long A4MonoDebut { get; set; }
    public long A3CoulDebut { get; set; }
    public long A4CoulDebut { get; set; }

    public long A3MonoFin { get; set; }
    public long A4MonoFin { get; set; }
    public long A3CoulFin { get; set; }
    public long A4CoulFin { get; set; }

    public long CopiesMonoA4Eq => (A3MonoFin - A3MonoDebut) * 2 + (A4MonoFin - A4MonoDebut);
    public long CopiesCoulA4Eq => (A3CoulFin - A3CoulDebut) * 2 + (A4CoulFin - A4CoulDebut);

    public Copieur Copieur { get; set; } = null!;
}
