using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BhoomiSetu.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;

namespace BhoomiSetu.Infrastructure.Identity;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId => Guid.TryParse(_httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    public string Username => _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
    public string Role => _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
    public Guid? OrganizationId => Guid.TryParse(_httpContextAccessor.HttpContext?.User.FindFirstValue("OrganizationId"), out var id) ? id : null;
    public Guid? StateId => Guid.TryParse(_httpContextAccessor.HttpContext?.User.FindFirstValue("StateId"), out var id) ? id : null;
    public Guid? DistrictId => Guid.TryParse(_httpContextAccessor.HttpContext?.User.FindFirstValue("DistrictId"), out var id) ? id : null;
    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}

public class JwtTokenService : IJwtTokenService
{
    private const string SecretKey = "BhoomiSetu_National_Land_Acquisition_Management_System_Super_Secret_Key_2026";

    public string GenerateJwtToken(Guid userId, string username, string role, Guid? organizationId, Guid? stateId, Guid? districtId, IEnumerable<string> permissions)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(SecretKey);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, username),
            new(ClaimTypes.Role, role),
            new("OrganizationId", organizationId?.ToString() ?? string.Empty),
            new("StateId", stateId?.ToString() ?? string.Empty),
            new("DistrictId", districtId?.ToString() ?? string.Empty)
        };

        claims.AddRange(permissions.Select(p => new Claim("Permission", p)));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
