using BurinTrack.Domain.Entities;
using BurinTrack.Domain.Enums;
using BurinTrack.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace BurinTrack.API.Extensions;

/// <summary>
/// Jeu de données FICTIF pour le développement et les démonstrations.
/// Exécuté uniquement en environnement Development et uniquement si aucun client n'existe.
/// </summary>
public static class DemoDataSeeder
{
    private record ClientSeed(
        string Nom, string Secteur, string Adresse, string Ville, string Commune,
        double Lat, double Lon, string Contact, string Fonction, string Tel);

    private static readonly ClientSeed[] Clients =
    [
        new("Groupe Lagune Assurances", "Assurances", "Boulevard Botreau Roussel, Immeuble Lagune", "Abidjan", "Plateau", 5.3228, -4.0191, "Awa Coulibaly", "Directrice administrative", "+225 27 20 21 00 10"),
        new("Clinique Les Palmiers", "Santé", "Rue des Jardins, Cocody Deux-Plateaux", "Abidjan", "Cocody", 5.3667, -3.9984, "Dr Serge Aka", "Directeur médical", "+225 27 22 41 55 20"),
        new("Cabinet Akwaba & Associés", "Conseil juridique", "Avenue Chardy, Résidence Akwaba", "Abidjan", "Plateau", 5.3195, -4.0225, "Me Nadège Boni", "Associée gérante", "+225 27 20 22 36 40"),
        new("Ivoire Logistique Services", "Transport & logistique", "Zone portuaire, Rue du Canal", "Abidjan", "Treichville", 5.2905, -4.0102, "Yannick Gnamien", "Responsable moyens généraux", "+225 27 21 24 18 00"),
        new("Hôtel Ébène Prestige", "Hôtellerie", "Boulevard de la Corniche", "Abidjan", "Marcory", 5.2998, -3.9831, "Fatoumata Diallo", "Directrice des opérations", "+225 27 21 26 70 90"),
        new("Cimenterie du Golfe", "Industrie", "Zone industrielle de Yopougon", "Abidjan", "Yopougon", 5.3440, -4.0780, "Jean-Marc Ouattara", "Directeur technique", "+225 27 23 45 12 33"),
        new("Lycée Excellence Koumassi", "Éducation", "Rue du Savoir, Koumassi Remblais", "Abidjan", "Koumassi", 5.2961, -3.9459, "Sylvie Tanoh", "Proviseure", "+225 27 21 36 44 05"),
        new("Pharmacie Centrale du Nord", "Santé", "Avenue de la Gare", "Bouaké", "Commerce", 7.6906, -5.0303, "Dr Moussa Sylla", "Pharmacien titulaire", "+225 27 31 63 20 14"),
        new("Coopérative Agricole du Bandama", "Agriculture", "Quartier Administratif", "Yamoussoukro", "Centre", 6.8276, -5.2893, "Pascal Kouadio", "Directeur général", "+225 27 30 64 11 80"),
        new("Atlantique Pêche & Négoce", "Agroalimentaire", "Port de pêche", "San-Pédro", "Bardot", 4.7485, -6.6363, "Léa Zadi", "Responsable administrative", "+225 27 34 71 25 66"),
        new("Centre de Formation Horizon", "Formation", "Riviera Palmeraie, Lot 112", "Abidjan", "Cocody", 5.3811, -3.9535, "Inès Kablan", "Directrice pédagogique", "+225 27 22 49 80 12"),
        new("SOTRAMAT Matériaux", "BTP", "Boulevard Valéry Giscard d'Estaing", "Abidjan", "Marcory", 5.2930, -3.9910, "Ibrahim Soro", "Chef comptable", "+225 27 21 35 60 77")
    ];

    private static readonly (string Prenom, string Nom, string Tel)[] Techs =
    [
        ("Yao", "Kouassi", "+225 07 08 11 22 33"),
        ("Aminata", "Traoré", "+225 05 44 66 77 88"),
        ("Ibrahim", "Koné", "+225 01 02 55 90 14"),
        ("Marie-Laure", "N'Guessan", "+225 07 59 12 34 56")
    ];

    private static readonly (string Marque, string Prefixe, string[] Modeles)[] Marques =
    [
        ("Xerox", "XRX", ["VersaLink C7130", "AltaLink B8145"]),
        ("Canon", "CNN", ["imageRUNNER ADVANCE DX C5840i", "imageRUNNER 2630i"]),
        ("HP", "HPQ", ["LaserJet Managed E87660", "Color LaserJet Managed E78323"]),
        ("Ricoh", "RCH", ["IM C3000", "MP 3055"]),
        ("Konica Minolta", "KMN", ["bizhub C360i", "bizhub 458e"]),
        ("Sharp", "SHP", ["MX-3071", "MX-M3571"])
    ];

    private static readonly int[] DecalagesFinContrat =
        [-14, 9, 18, 27, 41, 55, 75, 120, 200, 300, 450, 600, 800, 900];

    private static readonly string[] PbPanne =
        ["Bourrages papier répétés", "Erreur C-2801 au démarrage", "Impression avec traînées noires", "Scanner ne répond plus", "Écran tactile figé"];
    private static readonly string[] ActionsPanne =
        ["Remplacement du rouleau d'entraînement", "Nettoyage du bloc laser et réinitialisation", "Remplacement du tambour", "Mise à jour du firmware", "Remplacement de la carte contrôleur"];
    private static readonly string[] Pieces =
        ["Rouleau d'entraînement", "Tambour", "Unité de fusion", "Courroie de transfert", "Kit de maintenance", "Cartouche toner"];

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BurinTrackDbContext>();

        if (await db.Clients.AnyAsync()) return;

        var rng = new Random(2026);
        var now = DateTime.UtcNow;

        // Techniciens
        var techniciens = Techs.Select(t => new Technicien
        {
            UserId = string.Empty,
            Prenom = t.Prenom,
            Nom = t.Nom,
            Telephone = t.Tel,
            Email = $"{t.Prenom.ToLower().Replace("-", "")}.{t.Nom.ToLower().Replace("'", "")}@burinfort.com"
        }).ToList();
        db.Techniciens.AddRange(techniciens);

        // Clients
        var clients = new List<Client>();
        for (var i = 0; i < Clients.Length; i++)
        {
            var c = Clients[i];
            clients.Add(new Client
            {
                NomClient = c.Nom,
                RaisonSociale = c.Nom.ToUpper(),
                NumeroContrat = $"CTR-2025-{i + 1:D3}",
                SecteurActivite = c.Secteur,
                Adresse = c.Adresse,
                Ville = c.Ville,
                Commune = c.Commune,
                Pays = "Côte d'Ivoire",
                Latitude = c.Lat,
                Longitude = c.Lon,
                NomContact = c.Contact,
                FonctionContact = c.Fonction,
                Telephone = c.Tel,
                Email = $"contact@{Slug(c.Nom)}.ci"
            });
        }
        db.Clients.AddRange(clients);

        // Copieurs
        var copieurs = new List<Copieur>();
        var series = new HashSet<string>();
        foreach (var client in clients)
        {
            var nb = rng.Next(3, 8);
            for (var k = 0; k < nb; k++)
            {
                var (marque, prefixe, modeles) = Marques[rng.Next(Marques.Length)];
                var modele = modeles[rng.Next(modeles.Length)];
                string serie;
                do { serie = $"{prefixe}{rng.Next(100000, 999999)}"; } while (!series.Add(serie));

                var decalage = DecalagesFinContrat[rng.Next(DecalagesFinContrat.Length)];
                var fin = now.Date.AddDays(decalage);
                var situation = rng.NextDouble() switch
                {
                    < 0.82 => StatutCopieur.Actif,
                    < 0.94 => StatutCopieur.EnMaintenance,
                    < 0.98 => StatutCopieur.Remplace,
                    _ => StatutCopieur.HorsService
                };

                copieurs.Add(new Copieur
                {
                    ClientId = client.Id,
                    Client = client,
                    Marque = marque,
                    Modele = modele,
                    Designation = $"{marque} {modele}",
                    NumeroSerie = serie,
                    DateDebutContrat = fin.AddMonths(-36),
                    DateFinContrat = fin,
                    StatutContrat = fin < now ? StatutContrat.Expire : StatutContrat.Actif,
                    Situation = situation,
                    AdresseIP = $"192.168.{rng.Next(1, 40)}.{rng.Next(10, 250)}",
                    Localisation = new[] { "Accueil", "Open space", "Salle de reproduction", "Direction", "Comptabilité", "Secrétariat" }[rng.Next(6)],
                    NotesTechniques = rng.NextDouble() < 0.3 ? "Bac 3 à surveiller. Toner commandé auprès du fournisseur." : null
                });
            }
        }
        db.Copieurs.AddRange(copieurs);

        // Interventions
        var brouillons = new List<Intervention>();
        foreach (var cop in copieurs)
        {
            long nbCourant = rng.Next(20_000, 400_000);
            long coulCourant = rng.Next(5_000, 120_000);

            var dates = Enumerable.Range(0, rng.Next(1, 5))
                .Select(_ => now.AddDays(-rng.Next(1, 180)).AddHours(-rng.Next(0, 8)))
                .OrderBy(d => d)
                .ToList();

            foreach (var date in dates)
            {
                var nature = rng.NextDouble() switch
                {
                    < 0.34 => NatureIntervention.MaintenancePreventive,
                    < 0.56 => NatureIntervention.MaintenanceCurative,
                    < 0.82 => NatureIntervention.Panne,
                    < 0.88 => NatureIntervention.Installation,
                    < 0.93 => NatureIntervention.FormationUtilisateur,
                    < 0.98 => NatureIntervention.DeplacementTechnique,
                    _ => NatureIntervention.Autre
                };

                var ageJours = (now - date).TotalDays;
                var statut = ageJours switch
                {
                    > 25 => rng.NextDouble() < 0.7 ? StatutIntervention.Fermee : StatutIntervention.Resolue,
                    > 6 => rng.NextDouble() < 0.6 ? StatutIntervention.Resolue : StatutIntervention.EnCours,
                    _ => rng.NextDouble() < 0.5 ? StatutIntervention.Ouverte : StatutIntervention.EnCours
                };

                var nbPrec = nbCourant;
                var coulPrec = coulCourant;
                nbCourant += rng.Next(1_500, 18_000);
                coulCourant += rng.Next(400, 6_500);

                var arrivee = new DateTime(date.Year, date.Month, date.Day, rng.Next(8, 15), rng.Next(0, 59), 0, DateTimeKind.Utc);
                var estPanne = nature is NatureIntervention.Panne or NatureIntervention.MaintenanceCurative;
                var tech = techniciens[rng.Next(techniciens.Count)];

                brouillons.Add(new Intervention
                {
                    DateIntervention = date,
                    ClientId = cop.ClientId,
                    CopieurId = cop.Id,
                    TechnicienId = tech.Id,
                    CompteurNBPrecedent = nbPrec,
                    CompteurNBActuel = nbCourant,
                    CompteurCouleurPrecedent = coulPrec,
                    CompteurCouleurActuel = coulCourant,
                    Nature = nature,
                    DescriptionProbleme = estPanne
                        ? PbPanne[rng.Next(PbPanne.Length)]
                        : "Visite de contrôle périodique selon le plan de maintenance.",
                    ActionsRealisees = estPanne
                        ? ActionsPanne[rng.Next(ActionsPanne.Length)]
                        : "Nettoyage complet, contrôle des consommables, relevé des compteurs.",
                    PiecesRemplacees = estPanne && rng.NextDouble() < 0.6 ? Pieces[rng.Next(Pieces.Length)] : null,
                    HeureArrivee = arrivee,
                    HeureDepart = arrivee.AddMinutes(rng.Next(25, 150)),
                    ObservationTechnicien = statut is StatutIntervention.Resolue or StatutIntervention.Fermee
                        ? "Équipement opérationnel à la fin de l'intervention."
                        : null,
                    ObservationClient = statut == StatutIntervention.Fermee ? "Client satisfait." : null,
                    Statut = statut
                });
            }
        }

        // Numérotation chronologique par mois
        var compteurs = new Dictionary<string, int>();
        foreach (var inter in brouillons.OrderBy(i => i.DateIntervention))
        {
            var prefixe = $"INT-{inter.DateIntervention:yyyyMM}-";
            compteurs[prefixe] = compteurs.GetValueOrDefault(prefixe) + 1;
            inter.NumeroIntervention = $"{prefixe}{compteurs[prefixe]:D4}";
        }
        db.Interventions.AddRange(brouillons);

        await db.SaveChangesAsync();
    }

    private static string Slug(string s)
    {
        var normalized = s.Normalize(System.Text.NormalizationForm.FormD);
        var chars = normalized
            .Where(ch => System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch) != System.Globalization.UnicodeCategory.NonSpacingMark)
            .Where(char.IsLetterOrDigit)
            .Select(char.ToLowerInvariant);
        return new string(chars.ToArray());
    }
}
