FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/BurinTrack.API/BurinTrack.API.csproj", "src/BurinTrack.API/"]
COPY ["src/BurinTrack.Infrastructure/BurinTrack.Infrastructure.csproj", "src/BurinTrack.Infrastructure/"]
COPY ["src/BurinTrack.Application/BurinTrack.Application.csproj", "src/BurinTrack.Application/"]
COPY ["src/BurinTrack.Domain/BurinTrack.Domain.csproj", "src/BurinTrack.Domain/"]
RUN dotnet restore "src/BurinTrack.API/BurinTrack.API.csproj"
COPY . .
RUN dotnet build "src/BurinTrack.API/BurinTrack.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "src/BurinTrack.API/BurinTrack.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "BurinTrack.API.dll"]
