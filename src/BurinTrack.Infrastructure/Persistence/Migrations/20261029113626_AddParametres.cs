using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BurinTrack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddParametres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Parametres",
                columns: table => new
                {
                    Cle = table.Column<string>(type: "text", nullable: false),
                    Valeur = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Parametres", x => x.Cle);
                });

            migrationBuilder.InsertData(
                table: "Parametres",
                columns: new[] { "Cle", "UpdatedAt", "Valeur" },
                values: new object[,]
                {
                    { "alertes", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "{\"seuilJours1\":30,\"seuilJours2\":60,\"envoyerAutoAuDemarrage\":false}" },
                    { "entreprise", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "{\"nomSociete\":\"BURINFORT\",\"adresse\":\"\",\"telephone\":\"\",\"email\":\"\",\"siteWeb\":\"\"}" },
                    { "smtp", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "{\"hote\":\"\",\"port\":587,\"utilisateur\":\"\",\"motDePasse\":\"\",\"expediteur\":\"noreply@burinfort.com\",\"ssl\":true}" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Parametres");
        }
    }
}
