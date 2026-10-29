using Npgsql;
const string connStr = "Host=localhost;Port=5432;Database=burintrack;Username=burintrack;Password=burintrack_dev";
await using var conn = new NpgsqlConnection(connStr);
await conn.OpenAsync();
await using var cmd = new NpgsqlCommand(
  "DELETE FROM \"UserTokens\" WHERE \"UserId\"='a75146ca-cb22-4dcf-ad4f-49d992a4f1b1'; DELETE FROM \"UserRoles\" WHERE \"UserId\"='a75146ca-cb22-4dcf-ad4f-49d992a4f1b1'; DELETE FROM \"Users\" WHERE \"Id\"='a75146ca-cb22-4dcf-ad4f-49d992a4f1b1'; SELECT COUNT(*) FROM \"Users\";", conn);
await using var r = await cmd.ExecuteReaderAsync();
while (await r.ReadAsync()) Console.WriteLine($"Users: {r[0]}");
