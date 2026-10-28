using BurinTrack.Domain.Common;

namespace BurinTrack.Domain.Entities;

public class Technicien : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Telephone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool EstActif { get; set; } = true;

    // Navigation
    public ICollection<Intervention> Interventions { get; set; } = [];
}
