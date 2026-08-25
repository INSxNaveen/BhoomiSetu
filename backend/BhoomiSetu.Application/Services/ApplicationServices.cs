using BhoomiSetu.Application.Common.Interfaces;
using BhoomiSetu.Application.Common.Models;
using BhoomiSetu.Application.DTOs;
using BhoomiSetu.Domain.Common;
using BhoomiSetu.Domain.Enums;
using BhoomiSetu.Domain.Geography;
using BhoomiSetu.Domain.Identity;
using BhoomiSetu.Domain.LandAcquisition;
using BhoomiSetu.Domain.Projects;
using BhoomiSetu.Domain.Proposals;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BhoomiSetu.Application.Services;

#region Authentication CQRS
public record LoginCommand(string Username, string Password) : IRequest<Result<LoginResponseDto>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<LoginResponseDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenService _tokenService;

    public LoginCommandHandler(IApplicationDbContext context, IJwtTokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<Result<LoginResponseDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Organization)
            .Include(u => u.State)
            .Include(u => u.District)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                    .ThenInclude(r => r.RolePermissions)
                        .ThenInclude(rp => rp.Permission)
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.ToLower() && u.IsActive, cancellationToken);

        if (user == null || user.PasswordHash != request.Password)
        {
            return Result<LoginResponseDto>.Failure("Invalid username or password.");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var primaryRole = user.UserRoles.FirstOrDefault()?.Role.Name ?? "ProjectAgency";
        var permissions = user.UserRoles
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.Code)
            .Distinct()
            .ToList();

        var token = _tokenService.GenerateJwtToken(
            user.Id,
            user.Username,
            primaryRole,
            user.OrganizationId,
            user.StateId,
            user.DistrictId,
            permissions
        );

        var userInfo = new UserInfoDto(
            user.Id,
            user.Username,
            user.Email,
            user.FirstName,
            user.LastName,
            primaryRole,
            user.OrganizationId,
            user.Organization?.Name ?? "National Land Acquisition Directorate",
            user.StateId,
            user.State?.Name,
            user.DistrictId,
            user.District?.Name,
            permissions
        );

        return Result<LoginResponseDto>.Success(new LoginResponseDto(token, "Bearer", 86400, userInfo));
    }
}

public record RegisterCommand(RegisterRequestDto Request) : IRequest<Result<RegistrationResultDto>>;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<RegistrationResultDto>>
{
    private readonly IApplicationDbContext _context;

    public RegisterCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<RegistrationResultDto>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var req = request.Request;

        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.Email))
        {
            return Result<RegistrationResultDto>.Failure("Username, Email and Password are required fields.");
        }

        // Security check: SuperAdmin is strictly reserved for platform governance and cannot be registered publicly
        if (string.Equals(req.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
        {
            return Result<RegistrationResultDto>.Failure("Super Administrator accounts are system-reserved and cannot be registered publicly.");
        }

        var existingUser = await _context.Users.FirstOrDefaultAsync(
            u => u.Username.ToLower() == req.Username.Trim().ToLower() || u.Email.ToLower() == req.Email.Trim().ToLower(), 
            cancellationToken);

        if (existingUser != null)
        {
            return Result<RegistrationResultDto>.Failure("Username or Email is already registered. Please sign in or use different credentials.");
        }

        // Map and validate role
        var validRoles = new[] { "CentralAdmin", "StateAdmin", "DistrictAdmin", "ProjectAgency", "Citizen" };
        var roleName = validRoles.FirstOrDefault(r => string.Equals(r, req.Role?.Trim(), StringComparison.OrdinalIgnoreCase)) ?? "Citizen";
        
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name.ToLower() == roleName.ToLower(), cancellationToken);
        if (role == null)
        {
            role = new Role
            {
                Id = Guid.NewGuid(),
                Name = roleName,
                Description = $"{roleName} Operational Account"
            };
            _context.Roles.Add(role);
        }

        // Resolve Organization
        Organization? org = null;
        if (req.OrganizationId.HasValue)
        {
            org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == req.OrganizationId.Value, cancellationToken);
        }

        if (org == null && req.StateId.HasValue)
        {
            org = await _context.Organizations.FirstOrDefaultAsync(o => o.StateId == req.StateId.Value, cancellationToken);
        }

        org ??= await _context.Organizations.FirstOrDefaultAsync(cancellationToken);

        if (org == null)
        {
            org = new Organization
            {
                Id = Guid.NewGuid(),
                Name = "Ministry of Rural Development / Land Resources",
                Code = "MoRD-HQ",
                OrganizationType = OrganizationType.CentralMinistry,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Organizations.Add(org);
        }

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Username = req.Username.Trim(),
            Email = req.Email.Trim(),
            PasswordHash = req.Password,
            FirstName = string.IsNullOrWhiteSpace(req.FirstName) ? req.Username.Trim() : req.FirstName.Trim(),
            LastName = req.LastName?.Trim() ?? "",
            Phone = req.Phone?.Trim() ?? "",
            OrganizationId = org.Id,
            StateId = req.StateId ?? org.StateId,
            DistrictId = req.DistrictId ?? org.DistrictId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        newUser.UserRoles.Add(new UserRole
        {
            UserId = newUser.Id,
            RoleId = role.Id
        });

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync(cancellationToken);

        var resultDto = new RegistrationResultDto(
            newUser.Id,
            newUser.Username,
            newUser.Email,
            role.Name,
            "Registration successful. Please sign in using your registered credentials."
        );

        return Result<RegistrationResultDto>.Success(resultDto);
    }
}
#endregion

#region Dashboard CQRS
public record GetDashboardSummaryQuery : IRequest<Result<DashboardSummaryDto>>;

public class GetDashboardSummaryQueryHandler : IRequestHandler<GetDashboardSummaryQuery, Result<DashboardSummaryDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetDashboardSummaryQueryHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<DashboardSummaryDto>> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var totalProjects = await _context.Projects.CountAsync(cancellationToken);
        var pendingProposals = await _context.Proposals.CountAsync(p => p.Status == ProposalStatus.Submitted || p.Status == ProposalStatus.DistrictVerification || p.Status == ProposalStatus.StateReview, cancellationToken);
        var approvedProjects = await _context.Projects.CountAsync(p => p.Status == ProjectStatus.Approved || p.Status == ProjectStatus.AcquisitionInProgress || p.Status == ProjectStatus.Completed, cancellationToken);
        
        var totalLandProposed = await _context.Proposals.SumAsync(p => (decimal?)p.LandAreaProposed, cancellationToken) ?? 0m;
        var totalLandAcquired = await _context.LandParcels.Where(lp => lp.AcquisitionStatus == LandAcquisitionStatus.PossessionTaken || lp.AcquisitionStatus == LandAcquisitionStatus.CompensationPaid).SumAsync(lp => (decimal?)lp.AreaHectares, cancellationToken) ?? 0m;
        
        var totalAssessed = await _context.CompensationAssessments.SumAsync(ca => (decimal?)ca.TotalAmount, cancellationToken) ?? 0m;
        var totalDisbursed = await _context.CompensationPayments.Where(cp => cp.Status == "Completed").SumAsync(cp => (decimal?)cp.Amount, cancellationToken) ?? 0m;
        
        var affectedFamilies = await _context.AffectedFamilies.CountAsync(cancellationToken);
        var possessions = await _context.PossessionRecords.CountAsync(pr => pr.Status == PossessionStatus.PossessionTaken || pr.Status == PossessionStatus.HandedOver, cancellationToken);
        var rehabCases = await _context.RehabilitationCases.CountAsync(rc => rc.Status == RehabilitationStatus.Completed, cancellationToken);

        var dto = new DashboardSummaryDto(
            totalProjects,
            pendingProposals,
            approvedProjects,
            totalLandProposed,
            totalLandAcquired,
            totalAssessed,
            totalDisbursed,
            affectedFamilies,
            possessions,
            rehabCases
        );

        return Result<DashboardSummaryDto>.Success(dto);
    }
}
#endregion

#region Projects CQRS
public record GetProjectsQuery(Guid? StateId, Guid? DistrictId, ProjectStatus? Status) : IRequest<Result<List<ProjectDto>>>;

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, Result<List<ProjectDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetProjectsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ProjectDto>>> Handle(GetProjectsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Projects
            .Include(p => p.Organization)
            .Include(p => p.State)
            .Include(p => p.District)
            .AsQueryable();

        if (request.StateId.HasValue) query = query.Where(p => p.StateId == request.StateId.Value);
        if (request.DistrictId.HasValue) query = query.Where(p => p.DistrictId == request.DistrictId.Value);
        if (request.Status.HasValue) query = query.Where(p => p.Status == request.Status.Value);

        var projects = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProjectDto(
                p.Id,
                p.ProjectCode,
                p.Name,
                p.Description,
                p.ProjectType,
                p.OrganizationId,
                p.Organization.Name,
                p.StateId,
                p.State.Name,
                p.DistrictId,
                p.District.Name,
                p.EstimatedCost,
                p.RequiredAreaHectares,
                p.Status,
                p.StartDate,
                p.TargetCompletionDate,
                p.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return Result<List<ProjectDto>>.Success(projects);
    }
}
#endregion

#region Proposals CQRS
public record GetProposalsQuery(ProposalStatus? Status) : IRequest<Result<List<ProposalDto>>>;

public class GetProposalsQueryHandler : IRequestHandler<GetProposalsQuery, Result<List<ProposalDto>>>
{
    private readonly IApplicationDbContext _context;

    public GetProposalsQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<List<ProposalDto>>> Handle(GetProposalsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Proposals
            .Include(p => p.Project)
                .ThenInclude(proj => proj.State)
            .Include(p => p.Project)
                .ThenInclude(proj => proj.District)
            .Include(p => p.SubmittedBy)
            .Include(p => p.Reviews)
                .ThenInclude(r => r.Reviewer)
            .AsQueryable();

        if (request.Status.HasValue) query = query.Where(p => p.Status == request.Status.Value);

        var proposals = await query
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProposalDto(
                p.Id,
                p.ProposalNumber,
                p.ProjectId,
                p.Project.Name,
                p.Project.ProjectCode,
                p.SubmittedById,
                p.SubmittedBy.FirstName + " " + p.SubmittedBy.LastName,
                p.SubmittedAt,
                p.Status,
                p.LandAreaProposed,
                p.AffectedFamilyCount,
                p.EstimatedCompensation,
                p.CurrentStage,
                p.Project.StateId,
                p.Project.State.Name,
                p.Project.DistrictId,
                p.Project.District.Name,
                p.CreatedAt,
                p.Reviews.Select(r => new ProposalReviewDto(
                    r.Id,
                    r.Reviewer.FirstName + " " + r.Reviewer.LastName,
                    r.ReviewerRole,
                    r.Action,
                    r.Comments,
                    r.ReviewedAt
                )).ToList()
            ))
            .ToListAsync(cancellationToken);

        return Result<List<ProposalDto>>.Success(proposals);
    }
}

public record ProcessProposalReviewCommand(Guid ProposalId, string Action, string Comments) : IRequest<Result<ProposalDto>>;

public class ProcessProposalReviewCommandHandler : IRequestHandler<ProcessProposalReviewCommand, Result<ProposalDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public ProcessProposalReviewCommandHandler(IApplicationDbContext context, ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<Result<ProposalDto>> Handle(ProcessProposalReviewCommand request, CancellationToken cancellationToken)
    {
        var proposal = await _context.Proposals
            .Include(p => p.Project)
            .FirstOrDefaultAsync(p => p.Id == request.ProposalId, cancellationToken);

        if (proposal == null) return Result<ProposalDto>.Failure("Proposal not found.");

        var reviewerId = _currentUser.UserId ?? Guid.Empty;
        var reviewerRole = _currentUser.Role;

        // Workflow state machine validation
        switch (request.Action.ToLower())
        {
            case "submit":
                proposal.Status = ProposalStatus.DistrictVerification;
                proposal.CurrentStage = "District Field Verification";
                proposal.SubmittedAt = DateTime.UtcNow;
                break;
            case "verify":
                proposal.Status = ProposalStatus.StateReview;
                proposal.CurrentStage = "State Government Review & Approval";
                break;
            case "approve":
                proposal.Status = ProposalStatus.Approved;
                proposal.CurrentStage = "Sanctioned & Land Acquisition Active";
                proposal.Project.Status = ProjectStatus.AcquisitionInProgress;
                break;
            case "return":
                proposal.Status = ProposalStatus.ReturnedForCorrection;
                proposal.CurrentStage = "Returned to Agency for Revision";
                break;
            case "reject":
                proposal.Status = ProposalStatus.Rejected;
                proposal.CurrentStage = "Proposal Rejected";
                break;
            default:
                return Result<ProposalDto>.Failure("Invalid review action.");
        }

        var reviewRecord = new ProposalReview
        {
            ProposalId = proposal.Id,
            ReviewerId = reviewerId,
            ReviewerRole = reviewerRole,
            Action = request.Action,
            Comments = request.Comments,
            ReviewedAt = DateTime.UtcNow
        };

        _context.ProposalReviews.Add(reviewRecord);
        await _context.SaveChangesAsync(cancellationToken);

        return Result<ProposalDto>.Success(new ProposalDto(
            proposal.Id,
            proposal.ProposalNumber,
            proposal.ProjectId,
            proposal.Project.Name,
            proposal.Project.ProjectCode,
            proposal.SubmittedById,
            _currentUser.Username,
            proposal.SubmittedAt,
            proposal.Status,
            proposal.LandAreaProposed,
            proposal.AffectedFamilyCount,
            proposal.EstimatedCompensation,
            proposal.CurrentStage,
            proposal.Project.StateId,
            "",
            proposal.Project.DistrictId,
            "",
            proposal.CreatedAt,
            new List<ProposalReviewDto>()
        ), $"Proposal successfully processed to status: {proposal.Status}");
    }
}
#endregion
