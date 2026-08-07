namespace Ecommerce.Api.DTOs;

public class AuthDtos
{
    public record RegisterDto(string Email, string Password, string FullName);
    public record LoginDto(string Email, string Password);
    public record AuthResponseDto(string Token, DateTime ExpiresAt, string Email, string FullName, IList<string> Roles);
}