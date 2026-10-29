using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurinTrack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Titre = table.Column<string>(type: "text", nullable: false),
                    Message = table.Column<string>(type: "text", nullable: false),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    Lien = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Parametres",
                keyColumn: "Cle",
                keyValue: "entreprise",
                column: "Valeur",
                value: "{\"nomSociete\":\"BURINFORT\",\"nomApplication\":\"BurinTrack\",\"adresse\":\"\",\"telephone\":\"\",\"email\":\"\",\"siteWeb\":\"\",\"logoBase64\":\"\"}");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.UpdateData(
                table: "Parametres",
                keyColumn: "Cle",
                keyValue: "entreprise",
                column: "Valeur",
                value: "{\"nomSociete\":\"BURINFORT\",\"adresse\":\"\",\"telephone\":\"\",\"email\":\"\",\"siteWeb\":\"\"}");
        }
    }
}
