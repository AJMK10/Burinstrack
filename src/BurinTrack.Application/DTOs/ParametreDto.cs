using System.ComponentModel.DataAnnotations;

namespace BurinTrack.Application.DTOs;

public record ParametreDto(string Cle, string Valeur, DateTime UpdatedAt);
public record UpdateParametreDto([Required] string Valeur);
