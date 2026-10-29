$ErrorActionPreference = 'Stop'

$connStr = "Host=localhost;Port=5432;Database=burintrack;Username=burintrack;Password=burintrack_dev"

# Find Npgsql DLL in NuGet cache or project packages
$npgsqlDll = Get-ChildItem -Path "$env:USERPROFILE\.nuget\packages\npgsql" -Recurse -Filter "Npgsql.dll" |
    Where-Object { $_.FullName -match 'net8' } |
    Sort-Object FullName |
    Select-Object -Last 1

if (-not $npgsqlDll) {
    Write-Error "Npgsql.dll not found in NuGet cache. Run 'dotnet restore' first."
    exit 1
}

Write-Host "Using Npgsql: $($npgsqlDll.FullName)"
Add-Type -Path $npgsqlDll.FullName

$sqlFile = Join-Path $PSScriptRoot "seed-fpm.sql"
$sql = Get-Content $sqlFile -Raw -Encoding UTF8

$conn = New-Object Npgsql.NpgsqlConnection($connStr)
$conn.Open()
Write-Host "Connected to database."

$cmd = $conn.CreateCommand()
$cmd.CommandText = $sql
$cmd.CommandTimeout = 120

try {
    $reader = $cmd.ExecuteReader()
    Write-Host ""
    Write-Host "=== Verification ==="
    while ($reader.Read()) {
        Write-Host "$($reader[0]) : $($reader[1]) row(s)"
    }
    $reader.Close()
    Write-Host ""
    Write-Host "SUCCESS: FPM data inserted, old data deleted."
} finally {
    $conn.Close()
}
