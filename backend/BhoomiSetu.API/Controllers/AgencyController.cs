using BhoomiSetu.Application.Common.Interfaces;
using BhoomiSetu.Application.Common.Models;
using BhoomiSetu.Application.DTOs;
using BhoomiSetu.Domain.Enums;
using BhoomiSetu.Domain.LandAcquisition;
using BhoomiSetu.Domain.Projects;
using BhoomiSetu.Domain.Proposals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BhoomiSetu.API.Controllers;

[ApiController]
[Route("api/v1/agency")]
[Authorize(Roles = "ProjectAgency,SuperAdmin")]
public class AgencyController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AgencyController(IApplicationDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Helper to resolve the authenticated organization scope.
    /// Strictly prevents a Project Agency from accessing or modifying another agency's projects/proposals.
    /// </summary>
    private async Task<Guid?> GetEffectiveOrganizationIdAsync(Guid? queryOrgId = null)
    {
        if (User.IsInRole("SuperAdmin"))
        {
            if (queryOrgId.HasValue && queryOrgId.Value != Guid.Empty)
                return queryOrgId.Value;

            var defaultAgencyOrg = await _context.Organizations
                .Where(o => o.OrganizationType == OrganizationType.ProjectAgency)
                .OrderBy(o => o.Name)
                .FirstOrDefaultAsync();

            return defaultAgencyOrg?.Id;
        }

        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return null;

        var dbUser = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (dbUser != null && dbUser.OrganizationId != Guid.Empty)
        {
            return dbUser.OrganizationId;
        }

        var orgClaim = User.FindFirst("OrganizationId")?.Value;
        if (Guid.TryParse(orgClaim, out var orgIdFromClaim))
        {
            return orgIdFromClaim;
        }

        return null;
    }

    // =========================================================================
    // 1. AGENCY OPERATIONS DASHBOARD
    // =========================================================================
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] Guid? organizationId)
    {
        var orgId = await GetEffectiveOrganizationIdAsync(organizationId);
        if (!orgId.HasValue)
        {
            return BadRequest(ApiResponse<AgencyDashboardDto>.Fail("Organization context could not be resolved for the authenticated user."));
        }

        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == orgId.Value);
        if (org == null)
        {
            return NotFound(ApiResponse<AgencyDashboardDto>.Fail("Organization record not found."));
        }

        // Projects & Proposals for this agency
        var projects = await _context.Projects
            .Include(p => p.State)
            .Include(p => p.District)
            .Include(p => p.Milestones)
            .Where(p => p.OrganizationId == orgId.Value)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var projectIds = projects.Select(p => p.Id).ToList();

        var proposals = await _context.Proposals
            .Include(p => p.Project)
            .Include(p => p.Reviews)
            .Where(p => projectIds.Contains(p.ProjectId))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var parcels = await _context.LandParcels
            .Where(lp => projectIds.Contains(lp.ProjectId))
            .ToListAsync();

        var assessments = await _context.CompensationAssessments
            .Include(ca => ca.Payments)
            .Where(ca => projectIds.Contains(ca.ProjectId))
            .ToListAsync();

        var delayedMilestones = projects
            .SelectMany(p => p.Milestones)
            .Count(m => m.Status == "Delayed" || (m.PlannedDate < DateTime.UtcNow && m.Status != "Completed"));

        // 8 Key Performance Indicators
        var totalProjects = projects.Count;
        var draftProposals = proposals.Count(p => p.Status == ProposalStatus.Draft);
        var submittedProposals = proposals.Count(p => p.Status == ProposalStatus.Submitted || p.Status == ProposalStatus.DistrictVerification || p.Status == ProposalStatus.StateReview);
        var approvedProjects = projects.Count(p => p.Status == ProjectStatus.Approved || p.Status == ProjectStatus.AcquisitionInProgress || p.Status == ProjectStatus.CompensationPhase || p.Status == ProjectStatus.PossessionPhase || p.Status == ProjectStatus.Completed);
        var landRequiredHa = projects.Sum(p => p.RequiredAreaHectares);
        var landAcquiredHa = parcels.Where(p => p.AcquisitionStatus == LandAcquisitionStatus.PossessionTaken || p.AcquisitionStatus == LandAcquisitionStatus.CompensationPaid).Sum(p => p.AreaHectares);
        var compPaid = assessments.SelectMany(a => a.Payments).Where(p => p.Status == "Completed").Sum(p => p.Amount);

        var kpis = new AgencyKpisDto(
            totalProjects,
            draftProposals,
            submittedProposals,
            approvedProjects,
            landRequiredHa,
            landAcquiredHa,
            compPaid,
            delayedMilestones
        );

        // Attention Required Items (Actionable)
        var attentionItems = new List<AgencyAttentionItemDto>();

        // 1. Returned proposals
        var returnedProps = proposals.Where(p => p.Status == ProposalStatus.ReturnedForCorrection).ToList();
        foreach (var rp in returnedProps)
        {
            var lastReview = rp.Reviews.OrderByDescending(r => r.ReviewedAt).FirstOrDefault();
            attentionItems.Add(new AgencyAttentionItemDto(
                $"ret-{rp.Id}",
                "ReturnedProposal",
                $"Proposal {rp.ProposalNumber} Returned for Revision",
                lastReview?.Comments ?? "Survey/clearance discrepancy requires project agency resubmission.",
                "High",
                "/agency/tracking",
                rp.Id
            ));
        }

        // 2. Draft proposals pending submission
        var drafts = proposals.Where(p => p.Status == ProposalStatus.Draft).Take(2).ToList();
        foreach (var dp in drafts)
        {
            attentionItems.Add(new AgencyAttentionItemDto(
                $"draft-{dp.Id}",
                "DraftPending",
                $"Draft Proposal {dp.ProposalNumber} Incomplete",
                "Land requirement & social impact details draft saved. Complete documentation and submit.",
                "Info",
                "/agency/proposals/create",
                dp.Id
            ));
        }

        // 3. Delayed milestones
        var delayedProjectsList = projects.Where(p => p.Milestones.Any(m => m.Status == "Delayed" || (m.PlannedDate < DateTime.UtcNow && m.Status != "Completed"))).Take(2).ToList();
        foreach (var dp in delayedProjectsList)
        {
            var firstDelayed = dp.Milestones.FirstOrDefault(m => m.Status == "Delayed" || (m.PlannedDate < DateTime.UtcNow && m.Status != "Completed"));
            attentionItems.Add(new AgencyAttentionItemDto(
                $"delayed-{dp.Id}",
                "MilestoneDelayed",
                $"Milestone Overdue: {dp.Name}",
                $"{firstDelayed?.Name ?? "Statutory Milestone"} was planned for {firstDelayed?.PlannedDate:dd MMM yyyy}.",
                "Warning",
                $"/agency/projects/{dp.Id}",
                dp.Id
            ));
        }

        // 4. Pending compensation
        var pendingCompSum = assessments.Sum(a => a.TotalAmount) - compPaid;
        if (pendingCompSum > 0)
        {
            attentionItems.Add(new AgencyAttentionItemDto(
                "comp-pending",
                "CompensationPending",
                "Compensation Disbursement Pending",
                $"₹{(pendingCompSum / 10000000m):F2} Cr statutory CALA awards are currently under PFMS disbursement processing.",
                "Medium",
                "/agency/projects",
                null
            ));
        }

        // Projects Summary
        var projectSummaries = projects.Select(p =>
        {
            var pParcels = parcels.Where(lp => lp.ProjectId == p.Id).ToList();
            var acquired = pParcels.Where(lp => lp.AcquisitionStatus == LandAcquisitionStatus.PossessionTaken || lp.AcquisitionStatus == LandAcquisitionStatus.CompensationPaid).Sum(lp => lp.AreaHectares);
            var progressPct = p.RequiredAreaHectares > 0 ? (int)Math.Min(100, Math.Round((acquired / p.RequiredAreaHectares) * 100)) : 0;
            if (p.Status == ProjectStatus.Completed) progressPct = 100;

            return new AgencyProjectSummaryDto(
                p.Id,
                p.ProjectCode,
                p.Name,
                p.ProjectType.ToString(),
                $"{p.District.Name}, {p.State.Name}",
                p.State.Name,
                p.District.Name,
                progressPct,
                p.RequiredAreaHectares,
                acquired,
                p.Status.ToString(),
                p.Status.ToString(),
                p.UpdatedAt ?? p.CreatedAt
            );
        }).ToList();

        // Acquisition Progress Breakdown by Stage
        var totalParcelsCount = parcels.Count > 0 ? parcels.Count : 1;
        var acquisitionProgress = new List<AgencyAcquisitionProgressDto>
        {
            new("Proposed / Survey Initiation", parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.Proposed), parcels.Where(p => p.AcquisitionStatus == LandAcquisitionStatus.Proposed).Sum(p => p.AreaHectares), Math.Round((double)parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.Proposed) / totalParcelsCount * 100, 1)),
            new("Field Surveyed & Verified", parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.Surveyed), parcels.Where(p => p.AcquisitionStatus == LandAcquisitionStatus.Surveyed).Sum(p => p.AreaHectares), Math.Round((double)parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.Surveyed) / totalParcelsCount * 100, 1)),
            new("Section 11 Gazette Notified", parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.NotifiedSec4), parcels.Where(p => p.AcquisitionStatus == LandAcquisitionStatus.NotifiedSec4).Sum(p => p.AreaHectares), Math.Round((double)parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.NotifiedSec4) / totalParcelsCount * 100, 1)),
            new("Section 19 Declaration", parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.DeclarationSec19), parcels.Where(p => p.AcquisitionStatus == LandAcquisitionStatus.DeclarationSec19).Sum(p => p.AreaHectares), Math.Round((double)parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.DeclarationSec19) / totalParcelsCount * 100, 1)),
            new("Awarded & Compensation Paid", parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.CompensationPaid || p.AcquisitionStatus == LandAcquisitionStatus.Awarded), parcels.Where(p => p.AcquisitionStatus == LandAcquisitionStatus.CompensationPaid || p.AcquisitionStatus == LandAcquisitionStatus.Awarded).Sum(p => p.AreaHectares), Math.Round((double)parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.CompensationPaid || p.AcquisitionStatus == LandAcquisitionStatus.Awarded) / totalParcelsCount * 100, 1)),
            new("Physical Possession Taken", parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.PossessionTaken), parcels.Where(p => p.AcquisitionStatus == LandAcquisitionStatus.PossessionTaken).Sum(p => p.AreaHectares), Math.Round((double)parcels.Count(p => p.AcquisitionStatus == LandAcquisitionStatus.PossessionTaken) / totalParcelsCount * 100, 1))
        };

        // Recent Activity Feed from AuditLogs & Notifications
        var recentAudit = await _context.AuditLogs
            .OrderByDescending(a => a.CreatedAt)
            .Take(8)
            .Select(a => new AgencyActivityItemDto(
                a.Id,
                a.Action,
                $"{a.EntityType} record updated by {a.Username}",
                a.Username,
                "System Authority",
                a.CreatedAt,
                a.EntityType,
                a.EntityId
            ))
            .ToListAsync();

        var dashboardDto = new AgencyDashboardDto(
            org.Id,
            org.Name,
            org.Code,
            kpis,
            attentionItems,
            projectSummaries,
            acquisitionProgress,
            recentAudit,
            DateTime.UtcNow
        );

        return Ok(ApiResponse<AgencyDashboardDto>.Ok(dashboardDto));
    }

    // =========================================================================
    // 2. AGENCY PROJECTS (MY PROJECTS)
    // =========================================================================
    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects(
        [FromQuery] string? search,
        [FromQuery] ProjectType? projectType,
        [FromQuery] ProjectStatus? status,
        [FromQuery] Guid? stateId,
        [FromQuery] Guid? districtId)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<List<AgencyProjectSummaryDto>>.Fail("Organization context required."));

        var query = _context.Projects
            .Include(p => p.State)
            .Include(p => p.District)
            .Where(p => p.OrganizationId == orgId.Value)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.ProjectCode.ToLower().Contains(s) || p.Description.ToLower().Contains(s));
        }

        if (projectType.HasValue) query = query.Where(p => p.ProjectType == projectType.Value);
        if (status.HasValue) query = query.Where(p => p.Status == status.Value);
        if (stateId.HasValue && stateId.Value != Guid.Empty) query = query.Where(p => p.StateId == stateId.Value);
        if (districtId.HasValue && districtId.Value != Guid.Empty) query = query.Where(p => p.DistrictId == districtId.Value);

        var projects = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        var projectIds = projects.Select(p => p.Id).ToList();

        var parcels = await _context.LandParcels
            .Where(lp => projectIds.Contains(lp.ProjectId))
            .ToListAsync();

        var dtos = projects.Select(p =>
        {
            var pParcels = parcels.Where(lp => lp.ProjectId == p.Id).ToList();
            var acquired = pParcels.Where(lp => lp.AcquisitionStatus == LandAcquisitionStatus.PossessionTaken || lp.AcquisitionStatus == LandAcquisitionStatus.CompensationPaid).Sum(lp => lp.AreaHectares);
            var progressPct = p.RequiredAreaHectares > 0 ? (int)Math.Min(100, Math.Round((acquired / p.RequiredAreaHectares) * 100)) : 0;
            if (p.Status == ProjectStatus.Completed) progressPct = 100;

            return new AgencyProjectSummaryDto(
                p.Id,
                p.ProjectCode,
                p.Name,
                p.ProjectType.ToString(),
                $"{p.District.Name}, {p.State.Name}",
                p.State.Name,
                p.District.Name,
                progressPct,
                p.RequiredAreaHectares,
                acquired,
                p.Status.ToString(),
                p.Status.ToString(),
                p.UpdatedAt ?? p.CreatedAt
            );
        }).ToList();

        return Ok(ApiResponse<List<AgencyProjectSummaryDto>>.Ok(dtos));
    }

    // =========================================================================
    // 3. PROJECT WORKSPACE (DETAILED PROJECT CORRIDOR)
    // =========================================================================
    [HttpGet("projects/{id}")]
    public async Task<IActionResult> GetProjectWorkspace(Guid id)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<AgencyProjectWorkspaceDto>.Fail("Organization context required."));

        var project = await _context.Projects
            .Include(p => p.Organization)
            .Include(p => p.State)
            .Include(p => p.District)
            .Include(p => p.Milestones)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null)
        {
            return NotFound(ApiResponse<AgencyProjectWorkspaceDto>.Fail("Project not found."));
        }

        // STRICT Cross-Tenant Security Check
        if (!User.IsInRole("SuperAdmin") && project.OrganizationId != orgId.Value)
        {
            return StatusCode(403, ApiResponse<AgencyProjectWorkspaceDto>.Fail("You do not have permission to access projects outside your organization scope."));
        }

        var parcels = await _context.LandParcels
            .Include(p => p.State)
            .Include(p => p.District)
            .Include(p => p.Tehsil)
            .Include(p => p.Village)
            .Include(p => p.Owners)
            .Where(p => p.ProjectId == id)
            .Select(p => new LandParcelDto(
                p.Id,
                p.ProjectId,
                project.Name,
                p.StateId,
                p.State.Name,
                p.DistrictId,
                p.District.Name,
                p.TehsilId,
                p.Tehsil.Name,
                p.VillageId,
                p.Village.Name,
                p.SurveyNumber,
                p.ParcelNumber,
                p.AreaHectares,
                p.LandType,
                p.AcquisitionStatus,
                p.GeoJsonGeometry,
                p.Latitude,
                p.Longitude,
                p.Owners.Select(o => new ParcelOwnerDto(o.Id, o.OwnerName, o.OwnershipPercentage, o.IsPrimaryOwner, o.ContactPhone)).ToList()
            ))
            .ToListAsync();

        var proposalIds = await _context.Proposals
            .Where(p => p.ProjectId == id)
            .Select(p => p.Id)
            .ToListAsync();

        var documents = await _context.Documents
            .Include(d => d.UploadedBy)
            .Where(d => d.EntityId == id || proposalIds.Contains(d.EntityId))
            .Select(d => new AgencyDocumentItemDto(
                d.Id,
                d.DocumentType.ToString(),
                d.FileName,
                d.CurrentVersion,
                "Verified",
                d.CreatedAt,
                d.UploadedBy != null ? d.UploadedBy.FirstName + " " + d.UploadedBy.LastName : "Project Implementing Agency"
            ))
            .ToListAsync();

        var assessments = await _context.CompensationAssessments
            .Include(ca => ca.Payments)
            .Where(ca => ca.ProjectId == id)
            .ToListAsync();

        var totalAssessed = assessments.Sum(a => a.TotalAmount);
        var totalApproved = assessments.Where(a => a.Status == CompensationStatus.Approved || a.Status == CompensationStatus.Disbursed).Sum(a => a.TotalAmount);
        var totalDisbursed = assessments.SelectMany(a => a.Payments).Where(p => p.Status == "Completed").Sum(p => p.Amount);
        var pendingComp = totalAssessed - totalDisbursed;
        var compPct = totalAssessed > 0 ? (double)Math.Round((totalDisbursed / totalAssessed) * 100, 1) : 0;

        var compDto = new AgencyWorkspaceCompensationDto(
            totalAssessed,
            totalApproved,
            totalDisbursed,
            pendingComp > 0 ? pendingComp : 0,
            compPct
        );

        var possessionRecords = await _context.PossessionRecords
            .Where(pr => pr.ProjectId == id)
            .ToListAsync();

        var totalParcelsCount = parcels.Count;
        var takenCount = possessionRecords.Count(pr => pr.Status == PossessionStatus.PossessionTaken || pr.Status == PossessionStatus.HandedOver);
        var takenHectares = parcels.Where(p => p.AcquisitionStatus == LandAcquisitionStatus.PossessionTaken).Sum(p => p.AreaHectares);
        var possPct = totalParcelsCount > 0 ? (double)Math.Round(((double)takenCount / totalParcelsCount) * 100, 1) : 0;

        var possDto = new AgencyWorkspacePossessionDto(
            totalParcelsCount,
            takenCount,
            Math.Max(0, totalParcelsCount - takenCount),
            takenHectares,
            possPct
        );

        var families = await _context.AffectedFamilies
            .Include(af => af.RehabilitationCase)
            .Where(af => af.ProjectId == id)
            .ToListAsync();

        var totalFamilies = families.Count;
        var displacedFamilies = families.Count(f => f.IsDisplaced);
        var eligibleCases = families.Count(f => f.RehabilitationCase != null);
        var completedCases = families.Count(f => f.RehabilitationCase != null && f.RehabilitationCase.Status == RehabilitationStatus.Completed);
        var grantsDisbursed = families.Where(f => f.RehabilitationCase != null).Sum(f => f.RehabilitationCase!.ProvidedAmount);
        var rehabPct = eligibleCases > 0 ? (double)Math.Round(((double)completedCases / eligibleCases) * 100, 1) : 0;

        var rehabDto = new AgencyWorkspaceRehabilitationDto(
            totalFamilies,
            displacedFamilies,
            eligibleCases,
            completedCases,
            grantsDisbursed,
            rehabPct
        );

        var timeline = project.Milestones
            .OrderBy(m => m.SequenceNumber)
            .Select(m => new AgencyMilestoneItemDto(
                m.Id,
                m.Name,
                m.Description,
                m.PlannedDate,
                m.ActualDate,
                m.Status,
                m.SequenceNumber,
                m.Status == "Delayed" || (m.PlannedDate < DateTime.UtcNow && m.Status != "Completed")
            ))
            .ToList();

        var overallProgress = project.RequiredAreaHectares > 0
            ? (int)Math.Min(100, Math.Round((takenHectares / project.RequiredAreaHectares) * 100))
            : 0;

        if (project.Status == ProjectStatus.Completed) overallProgress = 100;

        var workspaceDto = new AgencyProjectWorkspaceDto(
            project.Id,
            project.ProjectCode,
            project.Name,
            project.Description,
            project.ProjectType.ToString(),
            project.Organization.Name,
            project.State.Name,
            project.District.Name,
            project.EstimatedCost,
            project.RequiredAreaHectares,
            takenHectares,
            overallProgress,
            project.Status.ToString(),
            project.Status.ToString(),
            project.StartDate,
            project.TargetCompletionDate,
            parcels,
            documents,
            compDto,
            possDto,
            rehabDto,
            timeline
        );

        return Ok(ApiResponse<AgencyProjectWorkspaceDto>.Ok(workspaceDto));
    }

    // =========================================================================
    // 4. AGENCY PROPOSALS (LIST & RETRIEVAL)
    // =========================================================================
    [HttpGet("proposals")]
    public async Task<IActionResult> GetProposals([FromQuery] string? search, [FromQuery] ProposalStatus? status)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<List<AgencyProposalItemDto>>.Fail("Organization context required."));

        var query = _context.Proposals
            .Include(p => p.Project)
                .ThenInclude(pr => pr.State)
            .Include(p => p.Project)
                .ThenInclude(pr => pr.District)
            .Include(p => p.Reviews)
            .Where(p => p.Project.OrganizationId == orgId.Value)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => p.ProposalNumber.ToLower().Contains(s) || p.Project.Name.ToLower().Contains(s) || p.Project.ProjectCode.ToLower().Contains(s));
        }

        var proposals = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

        var dtos = proposals.Select(p =>
        {
            var lastReturnReview = p.Reviews.Where(r => r.Action == "Return").OrderByDescending(r => r.ReviewedAt).FirstOrDefault();
            return new AgencyProposalItemDto(
                p.Id,
                p.ProposalNumber,
                p.ProjectId,
                p.Project.Name,
                p.Project.ProjectCode,
                p.Project.ProjectType.ToString(),
                p.Project.State.Name,
                p.Project.District.Name,
                p.Status,
                p.CurrentStage,
                p.LandAreaProposed,
                p.AffectedFamilyCount,
                p.EstimatedCompensation,
                p.SubmittedAt,
                p.CreatedAt,
                p.UpdatedAt ?? p.CreatedAt,
                lastReturnReview?.Comments
            );
        }).ToList();

        return Ok(ApiResponse<List<AgencyProposalItemDto>>.Ok(dtos));
    }

    [HttpGet("proposals/{id}")]
    public async Task<IActionResult> GetProposalById(Guid id)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<AgencyProposalItemDto>.Fail("Organization context required."));

        var proposal = await _context.Proposals
            .Include(p => p.Project)
                .ThenInclude(pr => pr.State)
            .Include(p => p.Project)
                .ThenInclude(pr => pr.District)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null) return NotFound(ApiResponse<AgencyProposalItemDto>.Fail("Proposal not found."));

        // Tenant check
        if (!User.IsInRole("SuperAdmin") && proposal.Project.OrganizationId != orgId.Value)
        {
            return StatusCode(403, ApiResponse<AgencyProposalItemDto>.Fail("You do not have permission to access proposals outside your organization scope."));
        }

        var lastReturnReview = proposal.Reviews.Where(r => r.Action == "Return").OrderByDescending(r => r.ReviewedAt).FirstOrDefault();

        var dto = new AgencyProposalItemDto(
            proposal.Id,
            proposal.ProposalNumber,
            proposal.ProjectId,
            proposal.Project.Name,
            proposal.Project.ProjectCode,
            proposal.Project.ProjectType.ToString(),
            proposal.Project.State.Name,
            proposal.Project.District.Name,
            proposal.Status,
            proposal.CurrentStage,
            proposal.LandAreaProposed,
            proposal.AffectedFamilyCount,
            proposal.EstimatedCompensation,
            proposal.SubmittedAt,
            proposal.CreatedAt,
            proposal.UpdatedAt ?? proposal.CreatedAt,
            lastReturnReview?.Comments
        );

        return Ok(ApiResponse<AgencyProposalItemDto>.Ok(dto));
    }

    // =========================================================================
    // 5. CREATE PROPOSAL (5-STEP WIZARD - SAVE DRAFT & SUBMIT)
    // =========================================================================
    [HttpPost("proposals")]
    public async Task<IActionResult> CreateProposal([FromBody] AgencyProposalCreationRequestDto dto)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<AgencyProposalItemDto>.Fail("Organization context required."));

        var username = User.Identity?.Name ?? "agency.user";
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return Unauthorized(ApiResponse<AgencyProposalItemDto>.Fail("User profile not found."));

        // Validation for new project
        Project project;
        if (dto.ProjectId.HasValue && dto.ProjectId.Value != Guid.Empty && !dto.IsNewProject)
        {
            project = await _context.Projects
                .Include(p => p.State)
                .Include(p => p.District)
                .FirstOrDefaultAsync(p => p.Id == dto.ProjectId.Value);

            if (project == null) return NotFound(ApiResponse<AgencyProposalItemDto>.Fail("Selected existing project not found."));
            if (project.OrganizationId != orgId.Value && !User.IsInRole("SuperAdmin"))
            {
                return StatusCode(403, ApiResponse<AgencyProposalItemDto>.Fail("Cannot create proposal for an external organization's project."));
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(dto.ProjectName))
                return BadRequest(ApiResponse<AgencyProposalItemDto>.Fail("Project Name is mandatory."));

            var state = await _context.States.FirstOrDefaultAsync(s => s.Id == dto.StateId);
            var district = await _context.Districts.FirstOrDefaultAsync(d => d.Id == dto.DistrictId);
            if (state == null || district == null)
                return BadRequest(ApiResponse<AgencyProposalItemDto>.Fail("Valid State and District selection is mandatory."));

            var pCode = !string.IsNullOrWhiteSpace(dto.ProjectCode)
                ? dto.ProjectCode
                : $"PRJ-{state.Code}-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(100, 999)}";

            project = new Project
            {
                Id = Guid.NewGuid(),
                ProjectCode = pCode,
                Name = dto.ProjectName,
                Description = dto.Description ?? $"Land acquisition proposal for {dto.ProjectName}",
                ProjectType = dto.ProjectType,
                OrganizationId = orgId.Value,
                StateId = dto.StateId,
                DistrictId = dto.DistrictId,
                EstimatedCost = dto.EstimatedCost > 0 ? dto.EstimatedCost : 50000000m,
                RequiredAreaHectares = dto.LandAreaProposed > 0 ? dto.LandAreaProposed : 10.0m,
                StartDate = dto.StartDate ?? DateTime.UtcNow.AddMonths(1),
                TargetCompletionDate = dto.TargetCompletionDate ?? DateTime.UtcNow.AddMonths(24),
                Status = dto.IsDraft ? ProjectStatus.Planning : ProjectStatus.ProposalSubmitted
            };

            // Standard Statutory Project Milestones
            project.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Administrative Proposal Review", PlannedDate = DateTime.UtcNow.AddDays(15), Status = "Pending", SequenceNumber = 1 });
            project.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Joint Measurement Survey (JMS)", PlannedDate = DateTime.UtcNow.AddDays(45), Status = "Pending", SequenceNumber = 2 });
            project.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Section 11 Preliminary Notification", PlannedDate = DateTime.UtcNow.AddDays(75), Status = "Pending", SequenceNumber = 3 });
            project.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Section 19 Acquisition Declaration", PlannedDate = DateTime.UtcNow.AddDays(135), Status = "Pending", SequenceNumber = 4 });
            project.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "CALA Award & Direct Benefit Transfer", PlannedDate = DateTime.UtcNow.AddDays(195), Status = "Pending", SequenceNumber = 5 });
            project.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project.Id, Name = "Physical Land Possession Handover", PlannedDate = DateTime.UtcNow.AddDays(240), Status = "Pending", SequenceNumber = 6 });

            _context.Projects.Add(project);
        }

        // Proposal Record
        var propNumber = $"PROP-{DateTime.UtcNow:yyyy}-{(project.State?.Code ?? "IN")}-{new Random().Next(100000, 999999)}";
        var proposal = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = propNumber,
            ProjectId = project.Id,
            SubmittedById = user.Id,
            SubmittedAt = dto.IsDraft ? null : DateTime.UtcNow,
            Status = dto.IsDraft ? ProposalStatus.Draft : ProposalStatus.Submitted,
            LandAreaProposed = dto.LandAreaProposed > 0 ? dto.LandAreaProposed : project.RequiredAreaHectares,
            AffectedFamilyCount = dto.AffectedFamilyCount,
            EstimatedCompensation = dto.EstimatedCompensation > 0 ? dto.EstimatedCompensation : project.EstimatedCost * 0.4m,
            CurrentStage = dto.IsDraft
                ? "Draft Preparation - Land Requirement Specification"
                : "Submitted - Awaiting District Revenue Scrutiny"
        };

        _context.Proposals.Add(proposal);

        // Attach Documents if provided
        if (dto.Documents != null && dto.Documents.Any())
        {
            foreach (var doc in dto.Documents)
            {
                var newDoc = new Document
                {
                    Id = Guid.NewGuid(),
                    EntityType = "Proposal",
                    EntityId = proposal.Id,
                    DocumentType = doc.DocumentType,
                    FileName = doc.FileName,
                    StoragePath = string.IsNullOrWhiteSpace(doc.StoragePath) ? $"/documents/proposals/{proposal.Id}/{doc.FileName}" : doc.StoragePath,
                    ContentType = "application/pdf",
                    FileSize = doc.FileSize > 0 ? doc.FileSize : 2048000,
                    CurrentVersion = 1,
                    UploadedById = user.Id
                };
                _context.Documents.Add(newDoc);
            }
        }

        // Audit Trail
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Username = user.Username,
            Action = dto.IsDraft ? "Draft Proposal Saved" : "Proposal Submitted",
            EntityType = "Proposal",
            EntityId = proposal.Id,
            NewValuesJson = $"{{\"ProposalNumber\":\"{propNumber}\",\"Status\":\"{proposal.Status}\",\"IsDraft\":{dto.IsDraft.ToString().ToLower()}}}",
            CreatedAt = DateTime.UtcNow
        });

        // Notifications
        if (!dto.IsDraft)
        {
            _context.UserNotifications.Add(new UserNotification
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Title = "Proposal Successfully Submitted",
                Message = $"Land acquisition proposal {propNumber} for {project.Name} has been submitted for District & State review.",
                NotificationType = "Success",
                EntityType = "Proposal",
                EntityId = proposal.Id,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();

        var stateName = project.State?.Name ?? (await _context.States.FirstOrDefaultAsync(s => s.Id == project.StateId))?.Name ?? "State";
        var districtName = project.District?.Name ?? (await _context.Districts.FirstOrDefaultAsync(d => d.Id == project.DistrictId))?.Name ?? "District";

        var resultDto = new AgencyProposalItemDto(
            proposal.Id,
            proposal.ProposalNumber,
            project.Id,
            project.Name,
            project.ProjectCode,
            project.ProjectType.ToString(),
            stateName,
            districtName,
            proposal.Status,
            proposal.CurrentStage,
            proposal.LandAreaProposed,
            proposal.AffectedFamilyCount,
            proposal.EstimatedCompensation,
            proposal.SubmittedAt,
            proposal.CreatedAt,
            DateTime.UtcNow,
            null
        );

        return Ok(ApiResponse<AgencyProposalItemDto>.Ok(resultDto, dto.IsDraft ? "Proposal draft saved successfully." : "Proposal submitted successfully to District & State Administration."));
    }

    // =========================================================================
    // 6. UPDATE PROPOSAL DRAFT / RESUME DRAFT
    // =========================================================================
    [HttpPut("proposals/{id}")]
    public async Task<IActionResult> UpdateProposalDraft(Guid id, [FromBody] AgencyProposalCreationRequestDto dto)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<AgencyProposalItemDto>.Fail("Organization context required."));

        var proposal = await _context.Proposals
            .Include(p => p.Project)
                .ThenInclude(pr => pr.State)
            .Include(p => p.Project)
                .ThenInclude(pr => pr.District)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null) return NotFound(ApiResponse<AgencyProposalItemDto>.Fail("Proposal not found."));

        if (!User.IsInRole("SuperAdmin") && proposal.Project.OrganizationId != orgId.Value)
        {
            return StatusCode(403, ApiResponse<AgencyProposalItemDto>.Fail("Permission denied."));
        }

        if (proposal.Status != ProposalStatus.Draft && proposal.Status != ProposalStatus.ReturnedForCorrection)
        {
            return BadRequest(ApiResponse<AgencyProposalItemDto>.Fail("Only Draft or Returned proposals can be edited."));
        }

        // Update fields
        if (dto.LandAreaProposed > 0) proposal.LandAreaProposed = dto.LandAreaProposed;
        if (dto.AffectedFamilyCount >= 0) proposal.AffectedFamilyCount = dto.AffectedFamilyCount;
        if (dto.EstimatedCompensation > 0) proposal.EstimatedCompensation = dto.EstimatedCompensation;
        proposal.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.ProjectName)) proposal.Project.Name = dto.ProjectName;
        if (dto.EstimatedCost > 0) proposal.Project.EstimatedCost = dto.EstimatedCost;
        if (dto.LandAreaProposed > 0) proposal.Project.RequiredAreaHectares = dto.LandAreaProposed;
        proposal.Project.UpdatedAt = DateTime.UtcNow;

        // If transitioning from draft to submitted directly in update
        if (!dto.IsDraft && proposal.Status == ProposalStatus.Draft)
        {
            proposal.Status = ProposalStatus.Submitted;
            proposal.SubmittedAt = DateTime.UtcNow;
            proposal.CurrentStage = "Submitted - Awaiting District Revenue Scrutiny";
            proposal.Project.Status = ProjectStatus.ProposalSubmitted;
        }

        await _context.SaveChangesAsync();

        var resultDto = new AgencyProposalItemDto(
            proposal.Id,
            proposal.ProposalNumber,
            proposal.ProjectId,
            proposal.Project.Name,
            proposal.Project.ProjectCode,
            proposal.Project.ProjectType.ToString(),
            proposal.Project.State.Name,
            proposal.Project.District.Name,
            proposal.Status,
            proposal.CurrentStage,
            proposal.LandAreaProposed,
            proposal.AffectedFamilyCount,
            proposal.EstimatedCompensation,
            proposal.SubmittedAt,
            proposal.CreatedAt,
            proposal.UpdatedAt ?? DateTime.UtcNow,
            null
        );

        return Ok(ApiResponse<AgencyProposalItemDto>.Ok(resultDto, "Proposal draft updated successfully."));
    }

    // =========================================================================
    // 7. SUBMIT PROPOSAL ATOMICALLY
    // =========================================================================
    [HttpPost("proposals/{id}/submit")]
    public async Task<IActionResult> SubmitProposal(Guid id)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<AgencyProposalItemDto>.Fail("Organization context required."));

        var proposal = await _context.Proposals
            .Include(p => p.Project)
                .ThenInclude(pr => pr.State)
            .Include(p => p.Project)
                .ThenInclude(pr => pr.District)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null) return NotFound(ApiResponse<AgencyProposalItemDto>.Fail("Proposal not found."));

        if (!User.IsInRole("SuperAdmin") && proposal.Project.OrganizationId != orgId.Value)
        {
            return StatusCode(403, ApiResponse<AgencyProposalItemDto>.Fail("Permission denied."));
        }

        if (proposal.Status != ProposalStatus.Draft && proposal.Status != ProposalStatus.ReturnedForCorrection)
        {
            return BadRequest(ApiResponse<AgencyProposalItemDto>.Fail($"Proposal is already in {proposal.Status} state and cannot be resubmitted."));
        }

        proposal.Status = ProposalStatus.Submitted;
        proposal.SubmittedAt = DateTime.UtcNow;
        proposal.CurrentStage = "Submitted - Awaiting District Revenue Scrutiny";
        proposal.UpdatedAt = DateTime.UtcNow;
        proposal.Project.Status = ProjectStatus.ProposalSubmitted;

        var username = User.Identity?.Name ?? "agency.user";
        _context.AuditLogs.Add(new AuditLog
        {
            Id = Guid.NewGuid(),
            Username = username,
            Action = "Proposal Submitted",
            EntityType = "Proposal",
            EntityId = proposal.Id,
            NewValuesJson = $"{{\"ProposalNumber\":\"{proposal.ProposalNumber}\",\"Status\":\"Submitted\"}}",
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        var resultDto = new AgencyProposalItemDto(
            proposal.Id,
            proposal.ProposalNumber,
            proposal.ProjectId,
            proposal.Project.Name,
            proposal.Project.ProjectCode,
            proposal.Project.ProjectType.ToString(),
            proposal.Project.State.Name,
            proposal.Project.District.Name,
            proposal.Status,
            proposal.CurrentStage,
            proposal.LandAreaProposed,
            proposal.AffectedFamilyCount,
            proposal.EstimatedCompensation,
            proposal.SubmittedAt,
            proposal.CreatedAt,
            DateTime.UtcNow,
            null
        );

        return Ok(ApiResponse<AgencyProposalItemDto>.Ok(resultDto, $"Proposal {proposal.ProposalNumber} submitted successfully. Now queued for District Revenue Scrutiny."));
    }

    // =========================================================================
    // 8. PROPOSAL TRACKING (LIFECYCLE & STATUTORY WORKFLOW TIMELINE)
    // =========================================================================
    [HttpGet("tracking")]
    public async Task<IActionResult> GetTrackingList([FromQuery] string? search, [FromQuery] string? status)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<List<AgencyTrackingItemDto>>.Fail("Organization context required."));

        var query = _context.Proposals
            .Include(p => p.Project)
            .Include(p => p.Reviews)
                .ThenInclude(r => r.Reviewer)
            .Where(p => p.Project.OrganizationId == orgId.Value)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(p => p.ProposalNumber.ToLower().Contains(s) || p.Project.Name.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (Enum.TryParse<ProposalStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(p => p.Status == parsedStatus);
            }
        }

        var proposals = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();

        var dtos = proposals.Select(p => BuildTrackingDto(p)).ToList();

        return Ok(ApiResponse<List<AgencyTrackingItemDto>>.Ok(dtos));
    }

    [HttpGet("tracking/{proposalId}")]
    public async Task<IActionResult> GetTrackingDetail(Guid proposalId)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<AgencyTrackingItemDto>.Fail("Organization context required."));

        var proposal = await _context.Proposals
            .Include(p => p.Project)
            .Include(p => p.Reviews)
                .ThenInclude(r => r.Reviewer)
            .FirstOrDefaultAsync(p => p.Id == proposalId);

        if (proposal == null) return NotFound(ApiResponse<AgencyTrackingItemDto>.Fail("Proposal not found."));

        if (!User.IsInRole("SuperAdmin") && proposal.Project.OrganizationId != orgId.Value)
        {
            return StatusCode(403, ApiResponse<AgencyTrackingItemDto>.Fail("Permission denied."));
        }

        var dto = BuildTrackingDto(proposal);
        return Ok(ApiResponse<AgencyTrackingItemDto>.Ok(dto));
    }

    // =========================================================================
    // 9. PROPOSAL DOCUMENT ATTACHMENT
    // =========================================================================
    [HttpPost("proposals/{id}/documents")]
    public async Task<IActionResult> AttachDocument(Guid id, [FromBody] AgencyDocumentSubmissionDto dto)
    {
        var orgId = await GetEffectiveOrganizationIdAsync();
        if (!orgId.HasValue) return BadRequest(ApiResponse<AgencyDocumentItemDto>.Fail("Organization context required."));

        var proposal = await _context.Proposals
            .Include(p => p.Project)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (proposal == null) return NotFound(ApiResponse<AgencyDocumentItemDto>.Fail("Proposal not found."));

        if (!User.IsInRole("SuperAdmin") && proposal.Project.OrganizationId != orgId.Value)
        {
            return StatusCode(403, ApiResponse<AgencyDocumentItemDto>.Fail("Permission denied."));
        }

        var username = User.Identity?.Name ?? "agency.user";
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
        if (user == null) return Unauthorized(ApiResponse<AgencyDocumentItemDto>.Fail("User profile not found."));

        var doc = new Document
        {
            Id = Guid.NewGuid(),
            EntityType = "Proposal",
            EntityId = proposal.Id,
            DocumentType = dto.DocumentType,
            FileName = dto.FileName,
            StoragePath = string.IsNullOrWhiteSpace(dto.StoragePath) ? $"/documents/proposals/{proposal.Id}/{dto.FileName}" : dto.StoragePath,
            ContentType = "application/pdf",
            FileSize = dto.FileSize > 0 ? dto.FileSize : 2048000,
            CurrentVersion = 1,
            UploadedById = user.Id
        };

        _context.Documents.Add(doc);
        await _context.SaveChangesAsync();

        var itemDto = new AgencyDocumentItemDto(
            doc.Id,
            doc.DocumentType.ToString(),
            doc.FileName,
            doc.CurrentVersion,
            "Uploaded",
            doc.CreatedAt,
            user.FirstName + " " + user.LastName
        );

        return Ok(ApiResponse<AgencyDocumentItemDto>.Ok(itemDto, "Document attached successfully."));
    }

    // =========================================================================
    // HELPER: Build Statutory Tracking DTO
    // =========================================================================
    private AgencyTrackingItemDto BuildTrackingDto(Proposal p)
    {
        var stages = new List<AgencyWorkflowStageDto>();

        // Stage 1: Draft
        stages.Add(new AgencyWorkflowStageDto(
            "Draft",
            "Draft Proposal Preparation",
            "Completed",
            p.CreatedAt,
            "Project Agency",
            "Land schedule and project justification prepared."
        ));

        // Stage 2: Submitted
        var isSubmitted = p.Status != ProposalStatus.Draft;
        stages.Add(new AgencyWorkflowStageDto(
            "Submitted",
            "Proposal Submission",
            isSubmitted ? "Completed" : "Pending",
            p.SubmittedAt,
            isSubmitted ? "Project Agency" : null,
            isSubmitted ? "Submitted to District & State Competent Authorities." : "Awaiting submission."
        ));

        // Stage 3: District Verification
        var isDistVerified = p.Status == ProposalStatus.StateReview || p.Status == ProposalStatus.Approved || p.Status == ProposalStatus.AcquisitionInitiated;
        var isDistCurrent = p.Status == ProposalStatus.Submitted || p.Status == ProposalStatus.DistrictVerification;
        var isReturned = p.Status == ProposalStatus.ReturnedForCorrection;
        var lastReview = p.Reviews.OrderByDescending(r => r.ReviewedAt).FirstOrDefault();

        stages.Add(new AgencyWorkflowStageDto(
            "DistrictVerification",
            "District Field Verification (CALA)",
            isDistVerified ? "Completed" : (isReturned ? "Returned" : (isDistCurrent ? "Current" : "Pending")),
            isDistVerified ? p.UpdatedAt ?? p.CreatedAt.AddDays(7) : null,
            "District Revenue Authority (CALA)",
            isReturned ? (lastReview?.Comments ?? "Returned for survey boundary correction.") : (isDistVerified ? "DGPS Khasra boundary verified on site." : "Joint survey in progress.")
        ));

        // Stage 4: State Review & Approval
        var isStateApproved = p.Status == ProposalStatus.Approved || p.Status == ProposalStatus.AcquisitionInitiated;
        var isStateCurrent = p.Status == ProposalStatus.StateReview;

        stages.Add(new AgencyWorkflowStageDto(
            "StateReview",
            "State Level Monitoring Committee (SLMC)",
            isStateApproved ? "Completed" : (isStateCurrent ? "Current" : "Pending"),
            isStateApproved ? p.UpdatedAt ?? p.CreatedAt.AddDays(14) : null,
            "State Land Acquisition Directorate",
            isStateApproved ? "Sanctioned under Section 8 RFCTLARR Act 2013." : (isStateCurrent ? "Under SLMC committee review." : "Pending district forwarding.")
        ));

        // Stage 5: Section 11 Notification
        var hasSec11 = p.Project.Status >= ProjectStatus.AcquisitionInProgress;
        stages.Add(new AgencyWorkflowStageDto(
            "Notification",
            "Section 11 Preliminary Notification",
            hasSec11 ? "Completed" : (isStateApproved ? "Current" : "Pending"),
            hasSec11 ? p.CreatedAt.AddDays(30) : null,
            "State Gazette Authority",
            hasSec11 ? "Gazette publication complete." : "Drafting gazette notification."
        ));

        // Stage 6: Award & Compensation
        var hasComp = p.Project.Status >= ProjectStatus.CompensationPhase;
        stages.Add(new AgencyWorkflowStageDto(
            "Compensation",
            "CALA Award & PFMS DBT Transfer",
            hasComp ? "Completed" : (hasSec11 ? "Current" : "Pending"),
            hasComp ? p.CreatedAt.AddDays(60) : null,
            "CALA Meerut / PFMS Gateway",
            hasComp ? "Solatium & DBT disbursement active." : "Valuation in progress."
        ));

        // Stage 7: Physical Possession
        var hasPoss = p.Project.Status >= ProjectStatus.PossessionPhase;
        stages.Add(new AgencyWorkflowStageDto(
            "Possession",
            "Section 38 Physical Possession",
            hasPoss ? "Completed" : (hasComp ? "Current" : "Pending"),
            hasPoss ? p.CreatedAt.AddDays(90) : null,
            "District Revenue Collectorate",
            hasPoss ? "Physical possession panchnama recorded." : "Pending award disbursement."
        ));

        // Stage 8: R&R Packages
        var isRehabComplete = p.Project.Status == ProjectStatus.Completed;
        stages.Add(new AgencyWorkflowStageDto(
            "Rehabilitation",
            "Second Schedule R&R Package Delivery",
            isRehabComplete ? "Completed" : (hasPoss ? "Current" : "Pending"),
            isRehabComplete ? p.CreatedAt.AddDays(120) : null,
            "R&R Administrator",
            isRehabComplete ? "Housing plot and subsistence grants settled." : "Plot allotment ongoing."
        ));

        var activity = p.Reviews.Select(r => new AgencyActivityItemDto(
            r.Id,
            $"{r.Action} Action Recorded",
            r.Comments,
            r.Reviewer != null ? r.Reviewer.FirstName + " " + r.Reviewer.LastName : r.ReviewerRole,
            r.ReviewerRole,
            r.ReviewedAt,
            "Proposal",
            p.Id
        )).ToList();

        var lastReturnReview = p.Reviews.Where(r => r.Action == "Return").OrderByDescending(r => r.ReviewedAt).FirstOrDefault();

        return new AgencyTrackingItemDto(
            p.Id,
            p.ProposalNumber,
            p.ProjectId,
            p.Project.Name,
            p.CurrentStage,
            p.Status.ToString(),
            p.SubmittedAt,
            p.UpdatedAt ?? p.CreatedAt,
            stages,
            activity,
            lastReturnReview?.Comments
        );
    }
}
