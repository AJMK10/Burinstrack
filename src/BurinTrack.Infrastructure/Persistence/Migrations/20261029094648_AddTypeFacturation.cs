using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BurinTrack.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTypeFacturation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TypeFacturation",
                table: "Clients",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TypeFacturation",
                table: "Clients");
        }
    }
}
