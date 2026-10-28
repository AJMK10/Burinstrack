using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurinTrack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddReleveCompteur : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "ForfaitCopieCouleur",
                table: "Clients",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "ForfaitCopieMono",
                table: "Clients",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<decimal>(
                name: "ForfaitMensuelHT",
                table: "Clients",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PrixCopieSupCouleur",
                table: "Clients",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PrixCopieSupMono",
                table: "Clients",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TauxTVA",
                table: "Clients",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "Releves",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CopieurId = table.Column<Guid>(type: "uuid", nullable: false),
                    Annee = table.Column<int>(type: "integer", nullable: false),
                    Mois = table.Column<int>(type: "integer", nullable: false),
                    A3MonoDebut = table.Column<long>(type: "bigint", nullable: false),
                    A4MonoDebut = table.Column<long>(type: "bigint", nullable: false),
                    A3CoulDebut = table.Column<long>(type: "bigint", nullable: false),
                    A4CoulDebut = table.Column<long>(type: "bigint", nullable: false),
                    A3MonoFin = table.Column<long>(type: "bigint", nullable: false),
                    A4MonoFin = table.Column<long>(type: "bigint", nullable: false),
                    A3CoulFin = table.Column<long>(type: "bigint", nullable: false),
                    A4CoulFin = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Releves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Releves_Copieurs_CopieurId",
                        column: x => x.CopieurId,
                        principalTable: "Copieurs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Releves_CopieurId_Annee_Mois",
                table: "Releves",
                columns: new[] { "CopieurId", "Annee", "Mois" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Releves");

            migrationBuilder.DropColumn(
                name: "ForfaitCopieCouleur",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ForfaitCopieMono",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "ForfaitMensuelHT",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PrixCopieSupCouleur",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "PrixCopieSupMono",
                table: "Clients");

            migrationBuilder.DropColumn(
                name: "TauxTVA",
                table: "Clients");
        }
    }
}
