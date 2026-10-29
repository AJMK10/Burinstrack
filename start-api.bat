@echo off
cd /d "C:\Users\burinfort\Documents\DOSSIER BURINFORT AO\burintrack\src\BurinTrack.API"
set ASPNETCORE_ENVIRONMENT=Production
set ASPNETCORE_URLS=http://localhost:5100
set ConnectionStrings__DefaultConnection=Host=aws-0-eu-west-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.dqvrfoaseimnlhgemslf;Password=Burintrack@123;SSL Mode=Require;Trust Server Certificate=true
set ConnectionStrings__Redis=localhost:6379,password=9fe1b2ee055b2871757b76e23f9566abd4ddf57e0c6b3b0622da6113c7c88228
set Jwt__Secret=ln9u/tpY8o+vAV/Yzu+6hIK1k8H3FOY2W/f1nN4LMVfC/PyzgPz4edXzhmfThZM4H1EGE4kdH/ZTFZlW36dkyA==
set Jwt__Issuer=burintrack-api
set Jwt__Audience=burintrack-web
set AllowedOrigins=http://localhost:5173
set ADMIN_INITIAL_PASSWORD=BurinTrack@2026!
set MinIO__Endpoint=localhost:4566
set MinIO__AccessKey=burintrack_minio
set MinIO__SecretKey=4frxXbrWmcO3Fir4S6Tcan8dLpv0WwqV
set MinIO__BucketName=burintrack
set MinIO__Secure=false
dotnet run --no-build
