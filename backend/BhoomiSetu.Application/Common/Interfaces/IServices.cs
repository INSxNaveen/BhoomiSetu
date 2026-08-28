namespace BhoomiSetu.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string Username { get; }
    string Role { get; }
    Guid? OrganizationId { get; }
    Guid? StateId { get; }
    Guid? DistrictId { get; }
    bool IsAuthenticated { get; }
}

public interface IJwtTokenService
{
    string GenerateJwtToken(Guid userId, string username, string role, Guid? organizationId, Guid? stateId, Guid? districtId, IEnumerable<string> permissions);
}

public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}
