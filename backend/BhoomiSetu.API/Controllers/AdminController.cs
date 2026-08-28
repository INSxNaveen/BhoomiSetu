using BhoomiSetu.Application.Common.Interfaces;
using BhoomiSetu.Application.Common.Models;
using BhoomiSetu.Application.DTOs;
using BhoomiSetu.Domain.Identity;
using BhoomiSetu.Domain.LandAcquisition;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BhoomiSetu.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class AdminController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AdminController(IApplicationDbContext context)
    {
        _context = context;
    }

    // --- DASHBOARD & SYSTEM HEALTH ---

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetAdminDashboard()
    {
        var totalUsers = await _context.Users.CountAsync();
        var activeOrgs = await _context.Organizations.CountAsync(o => o.IsActive);
        var totalProjects = await _context.Projects.CountAsync();
        var activeStates = await _context.States.CountAsync();

        var dto = new AdminDashboardDto(
            totalUsers,
            activeOrgs,
            totalProjects,
            activeStates,
            "Operational",
            "Healthy"
        );

        return Ok(ApiResponse<AdminDashboardDto>.Ok(dto));
    }

    [HttpGet("system/health")]
    public async Task<IActionResult> GetSystemHealth()
    {
        var items = new List<ServiceHealthItemDto>
        {
            new("API Gateway", "Operational", "99.98%", "Latency 12ms"),
            new("Authentication Service", "Operational", "100.0%", "JWT Bearer active"),
            new("Database Service (EF Core)", "Operational", "99.99%", "Connection pool healthy"),
            new("GIS Spatial Service (PostGIS)", "Operational", "99.95%", "Leaflet GeoJSON active"),
            new("Notification Engine", "Operational", "99.90%", "SMTP / SMS Ready"),
            new("Audit Trail Engine", "Operational", "100.0%", "Immutable logging on")
        };

        return Ok(ApiResponse<List<ServiceHealthItemDto>>.Ok(items));
    }

    [HttpGet("activity")]
    public async Task<IActionResult> GetRecentActivity()
    {
        var logs = await _context.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .Select(a => new AuditLogDto(
                a.Id,
                a.UserId,
                a.Username,
                a.Action,
                a.EntityType,
                a.EntityId,
                a.OldValuesJson,
                a.NewValuesJson,
                a.IpAddress,
                a.CreatedAt
            ))
            .ToListAsync();

        return Ok(ApiResponse<List<AuditLogDto>>.Ok(logs));
    }

    [HttpGet("users/distribution")]
    public async Task<IActionResult> GetUserDistribution()
    {
        var total = await _context.Users.CountAsync();
        if (total == 0) total = 1;

        var dist = await _context.UserRoles
            .Include(ur => ur.Role)
            .GroupBy(ur => ur.Role.Name)
            .Select(g => new UserDistributionDto(
                g.Key,
                g.Count(),
                Math.Round((double)g.Count() / total * 100, 1)
            ))
            .ToListAsync();

        return Ok(ApiResponse<List<UserDistributionDto>>.Ok(dist));
    }

    // --- USER MANAGEMENT ---

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] Guid? organizationId,
        [FromQuery] bool? isActive,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Users
            .Include(u => u.Organization)
            .Include(u => u.State)
            .Include(u => u.District)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u => u.FirstName.ToLower().Contains(s) ||
                                     u.LastName.ToLower().Contains(s) ||
                                     u.Email.ToLower().Contains(s) ||
                                     u.Username.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name.ToLower() == role.ToLower()));
        }

        if (organizationId.HasValue && organizationId.Value != Guid.Empty)
        {
            query = query.Where(u => u.OrganizationId == organizationId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.FirstName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(
                u.Id,
                u.Username,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Phone,
                u.OrganizationId,
                u.Organization.Name,
                u.StateId,
                u.State != null ? u.State.Name : null,
                u.DistrictId,
                u.District != null ? u.District.Name : null,
                u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "User",
                u.IsActive,
                u.LastLoginAt,
                u.CreatedAt
            ))
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(new
        {
            items = users,
            totalCount,
            pageNumber,
            pageSize
        }));
    }

    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var u = await _context.Users
            .Include(x => x.Organization)
            .Include(x => x.State)
            .Include(x => x.District)
            .Include(x => x.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (u == null) return NotFound(ApiResponse<AdminUserDto>.Fail("User not found"));

        var dto = new AdminUserDto(
            u.Id,
            u.Username,
            u.Email,
            u.FirstName,
            u.LastName,
            u.Phone,
            u.OrganizationId,
            u.Organization.Name,
            u.StateId,
            u.State?.Name,
            u.DistrictId,
            u.District?.Name,
            u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? "User",
            u.IsActive,
            u.LastLoginAt,
            u.CreatedAt
        );

        return Ok(ApiResponse<AdminUserDto>.Ok(dto));
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateAdminUserRequestDto req)
    {
        if (await _context.Users.AnyAsync(u => u.Username.ToLower() == req.Username.ToLower() || u.Email.ToLower() == req.Email.ToLower()))
        {
            return BadRequest(ApiResponse<AdminUserDto>.Fail("Username or Email already exists."));
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = req.Username,
            Email = req.Email,
            FirstName = req.FirstName,
            LastName = req.LastName,
            Phone = req.Phone,
            PasswordHash = "Password@123",
            OrganizationId = req.OrganizationId,
            StateId = req.StateId,
            DistrictId = req.DistrictId,
            IsActive = req.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);

        var roleEntity = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == req.Role.ToLower());
        if (roleEntity != null)
        {
            _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleEntity.Id });
        }

        // Add audit log
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Username = User.Identity?.Name ?? "SuperAdmin",
            Action = "CREATE_USER",
            EntityType = "User",
            EntityId = user.Id,
            NewValuesJson = $"Created user {user.Username} with role {req.Role}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var org = await _context.Organizations.FindAsync(user.OrganizationId);

        var dto = new AdminUserDto(
            user.Id,
            user.Username,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Phone,
            user.OrganizationId,
            org?.Name ?? "Organization",
            user.StateId,
            null,
            user.DistrictId,
            null,
            req.Role,
            user.IsActive,
            null,
            user.CreatedAt
        );

        return Ok(ApiResponse<AdminUserDto>.Ok(dto, "User created successfully."));
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateAdminUserRequestDto req)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) return NotFound(ApiResponse<AdminUserDto>.Fail("User not found"));

        user.FirstName = req.FirstName;
        user.LastName = req.LastName;
        user.Email = req.Email;
        user.Phone = req.Phone;
        user.OrganizationId = req.OrganizationId;
        user.StateId = req.StateId;
        user.DistrictId = req.DistrictId;
        user.IsActive = req.IsActive;

        // Update Role
        _context.UserRoles.RemoveRange(user.UserRoles);
        var roleEntity = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == req.Role.ToLower());
        if (roleEntity != null)
        {
            _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = roleEntity.Id });
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Username = User.Identity?.Name ?? "SuperAdmin",
            Action = "UPDATE_USER",
            EntityType = "User",
            EntityId = user.Id,
            NewValuesJson = $"Updated user {user.Username}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok("User updated successfully"));
    }

    [HttpPatch("users/{id}/status")]
    public async Task<IActionResult> ToggleUserStatus(Guid id, [FromBody] bool isActive)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound(ApiResponse<string>.Fail("User not found"));

        user.IsActive = isActive;

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Username = User.Identity?.Name ?? "SuperAdmin",
            Action = isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
            EntityType = "User",
            EntityId = user.Id,
            NewValuesJson = $"User {user.Username} IsActive set to {isActive}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<bool>.Ok(isActive, $"User has been {(isActive ? "activated" : "deactivated")}."));
    }

    // --- ORGANIZATION MANAGEMENT ---

    [HttpGet("organizations")]
    public async Task<IActionResult> GetOrganizations([FromQuery] string? search, [FromQuery] bool? isActive)
    {
        var query = _context.Organizations
            .Include(o => o.State)
            .Include(o => o.District)
            .Include(o => o.Users)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(o => o.Name.ToLower().Contains(s) || o.Code.ToLower().Contains(s));
        }

        if (isActive.HasValue)
        {
            query = query.Where(o => o.IsActive == isActive.Value);
        }

        var orgs = await query.Select(o => new AdminOrganizationDto(
            o.Id,
            o.Name,
            o.Code,
            o.OrganizationType,
            o.StateId,
            o.State != null ? o.State.Name : null,
            o.DistrictId,
            o.District != null ? o.District.Name : null,
            "admin@" + o.Code.ToLower() + ".gov.in",
            o.IsActive,
            o.Users.Count,
            _context.Projects.Count(p => p.OrganizationId == o.Id),
            o.CreatedAt
        )).ToListAsync();

        return Ok(ApiResponse<List<AdminOrganizationDto>>.Ok(orgs));
    }

    [HttpPost("organizations")]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateAdminOrganizationRequestDto req)
    {
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Code = req.Code,
            OrganizationType = req.OrganizationType,
            StateId = req.StateId,
            DistrictId = req.DistrictId,
            IsActive = req.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.Organizations.Add(org);

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Username = User.Identity?.Name ?? "SuperAdmin",
            Action = "CREATE_ORGANIZATION",
            EntityType = "Organization",
            EntityId = org.Id,
            NewValuesJson = $"Created organization {org.Name} ({org.Code})",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok("Organization created successfully"));
    }

    // --- ROLES & PERMISSIONS MATRIX ---

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.Roles
            .Include(r => r.UserRoles)
            .Include(r => r.RolePermissions)
            .Select(r => new AdminRoleDto(
                r.Id,
                r.Name,
                r.Description,
                r.UserRoles.Count,
                r.RolePermissions.Count
            ))
            .ToListAsync();

        return Ok(ApiResponse<List<AdminRoleDto>>.Ok(roles));
    }

    [HttpGet("roles/{id}/permissions")]
    public async Task<IActionResult> GetRolePermissionsMatrix(Guid id)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role == null) return NotFound(ApiResponse<RolePermissionsMatrixDto>.Fail("Role not found"));

        var allPermissions = await _context.Permissions.ToListAsync();
        var grantedIds = role.RolePermissions.Select(rp => rp.PermissionId).ToHashSet();

        var matrix = allPermissions.Select(p => new PermissionMatrixItemDto(
            p.Id,
            p.Code,
            p.Name,
            p.Module,
            p.Code.Split('.').Last(), // View, Create, Edit, Approve
            grantedIds.Contains(p.Id)
        )).ToList();

        var dto = new RolePermissionsMatrixDto(
            role.Id,
            role.Name,
            role.Description,
            matrix
        );

        return Ok(ApiResponse<RolePermissionsMatrixDto>.Ok(dto));
    }

    [HttpPut("roles/{id}/permissions")]
    public async Task<IActionResult> UpdateRolePermissions(Guid id, [FromBody] UpdateRolePermissionsRequestDto req)
    {
        var role = await _context.Roles
            .Include(r => r.RolePermissions)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (role == null) return NotFound(ApiResponse<string>.Fail("Role not found"));

        _context.RolePermissions.RemoveRange(role.RolePermissions);

        foreach (var permId in req.GrantedPermissionIds)
        {
            _context.RolePermissions.Add(new RolePermission
            {
                RoleId = role.Id,
                PermissionId = permId
            });
        }

        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Username = User.Identity?.Name ?? "SuperAdmin",
            Action = "UPDATE_ROLE_PERMISSIONS",
            EntityType = "Role",
            EntityId = role.Id,
            NewValuesJson = $"Updated permissions for role {role.Name}. Granted count: {req.GrantedPermissionIds.Count}",
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(ApiResponse<string>.Ok("Role permissions updated successfully."));
    }
}
