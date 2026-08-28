using BhoomiSetu.Application.Common.Interfaces;
using BhoomiSetu.Application.Common.Models;
using BhoomiSetu.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BhoomiSetu.API.Controllers;

public record PublicStatisticsDto(
    int TotalProjects,
    int TotalProposals,
    decimal TotalLandRequiredHectares,
    decimal TotalLandAcquiredHectares,
    decimal TotalCompensationAssessedInr,
    decimal TotalCompensationDisbursedInr,
    int StatesCoveredCount,
    int DistrictsCoveredCount,
    int OrganizationsCount,
    int AffectedFamiliesCount,
    bool IsDemonstrationData,
    string DataSource,
    DateTime GeneratedAt
);

public record StateGeoSummaryDto(
    Guid StateId,
    string StateCode,
    string StateName,
    int ProjectCount,
    List<DistrictGeoSummaryDto> Districts
);

public record DistrictGeoSummaryDto(
    Guid DistrictId,
    string DistrictCode,
    string DistrictName,
    int ProjectCount
);

public record PublicInquiryRequest(
    string? SurveyNumber,
    string? KhasraNumber,
    string? StateName,
    string? DistrictName
);

public record PublicInquiryResultDto(
    bool Found,
    string QueryEntered,
    string? SurveyNumber,
    string? VillageName,
    string? TehsilName,
    string? DistrictName,
    string? StateName,
    string? ProjectName,
    string? ImplementingAgency,
    string? AcquisitionStage,
    string? NotificationStatus,
    string? LandType,
    decimal? AreaHectares,
    string DataPrivacyNotice,
    bool RequiresCitizenLogin
);

public record PublicNoticeDto(
    Guid Id,
    string NoticeNumber,
    string Title,
    string ProjectName,
    string ImplementingAgency,
    string StateName,
    string DistrictName,
    string Stage,
    DateTime PublishedDate,
    string Summary
);

[ApiController]
[Route("api/v1/public")]
[AllowAnonymous]
public class PublicPortalController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public PublicPortalController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetPublicStatistics()
    {
        var totalProjects = await _context.Projects.CountAsync();
        var totalProposals = await _context.Proposals.CountAsync();
        var totalLandReq = await _context.Projects.SumAsync(p => p.RequiredAreaHectares);
        
        var totalLandAcquired = await _context.PossessionRecords
            .Where(pr => pr.Status == PossessionStatus.PossessionTaken || pr.Status == PossessionStatus.HandedOver)
            .SumAsync(pr => (decimal?)pr.Parcel.AreaHectares) ?? 0;

        var totalAssessed = await _context.CompensationAssessments
            .SumAsync(ca => (decimal?)ca.TotalAmount) ?? 0;

        var totalDisbursed = await _context.CompensationPayments
            .Where(cp => cp.Status == "Completed" || cp.Status == "Processed")
            .SumAsync(cp => (decimal?)cp.Amount) ?? 0;

        var statesCount = await _context.States.CountAsync();
        var districtsCount = await _context.Districts.CountAsync();
        var orgsCount = await _context.Organizations.CountAsync();
        var familiesCount = await _context.AffectedFamilies.CountAsync();

        var stats = new PublicStatisticsDto(
            TotalProjects: totalProjects,
            TotalProposals: totalProposals,
            TotalLandRequiredHectares: Math.Round(totalLandReq, 2),
            TotalLandAcquiredHectares: Math.Round(totalLandAcquired, 2),
            TotalCompensationAssessedInr: totalAssessed,
            TotalCompensationDisbursedInr: totalDisbursed,
            StatesCoveredCount: statesCount,
            DistrictsCoveredCount: districtsCount,
            OrganizationsCount: orgsCount,
            AffectedFamiliesCount: familiesCount,
            IsDemonstrationData: true,
            DataSource: "BhoomiSetu National Master Platform Demo Repository",
            GeneratedAt: DateTime.UtcNow
        );

        return Ok(ApiResponse<PublicStatisticsDto>.Ok(stats));
    }

    [HttpGet("geo-summary")]
    public async Task<IActionResult> GetGeoSummary()
    {
        var states = await _context.States
            .Include(s => s.Districts)
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new StateGeoSummaryDto(
                s.Id,
                s.Code,
                s.Name,
                _context.Projects.Count(p => p.StateId == s.Id),
                s.Districts.Where(d => d.IsActive).OrderBy(d => d.Name).Select(d => new DistrictGeoSummaryDto(
                    d.Id,
                    d.Code,
                    d.Name,
                    _context.Projects.Count(p => p.DistrictId == d.Id)
                )).ToList()
            ))
            .ToListAsync();

        return Ok(ApiResponse<List<StateGeoSummaryDto>>.Ok(states));
    }

    [HttpPost("inquiry")]
    public async Task<IActionResult> CheckLandStatus([FromBody] PublicInquiryRequest request)
    {
        var query = (request.SurveyNumber ?? request.KhasraNumber ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(query))
        {
            return BadRequest(ApiResponse<PublicInquiryResultDto>.Fail("Please enter a valid Survey Number or Khasra Number."));
        }

        var parcelQuery = _context.LandParcels
            .Include(p => p.Project)
                .ThenInclude(pr => pr.Organization)
            .Include(p => p.State)
            .Include(p => p.District)
            .Include(p => p.Tehsil)
            .Include(p => p.Village)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.StateName) && request.StateName != "All States")
        {
            parcelQuery = parcelQuery.Where(p => p.State.Name.ToLower() == request.StateName.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(request.DistrictName))
        {
            parcelQuery = parcelQuery.Where(p => p.District.Name.ToLower() == request.DistrictName.ToLower());
        }

        var matchedParcel = await parcelQuery
            .FirstOrDefaultAsync(p => p.SurveyNumber.ToLower().Contains(query) || p.ParcelNumber.ToLower().Contains(query));

        if (matchedParcel == null)
        {
            // If specific number not found, check if query matches any village or project
            matchedParcel = await parcelQuery.FirstOrDefaultAsync(p => p.Village.Name.ToLower().Contains(query));
        }

        if (matchedParcel != null)
        {
            var result = new PublicInquiryResultDto(
                Found: true,
                QueryEntered: query,
                SurveyNumber: matchedParcel.SurveyNumber,
                VillageName: matchedParcel.Village?.Name ?? "Surveyed Area",
                TehsilName: matchedParcel.Tehsil?.Name ?? "District Tehsil",
                DistrictName: matchedParcel.District?.Name,
                StateName: matchedParcel.State?.Name,
                ProjectName: matchedParcel.Project?.Name,
                ImplementingAgency: matchedParcel.Project?.Organization?.Name ?? "Infrastructure Authority",
                AcquisitionStage: matchedParcel.AcquisitionStatus.ToString(),
                NotificationStatus: GetNotificationStatusLabel(matchedParcel.AcquisitionStatus),
                LandType: matchedParcel.LandType.ToString(),
                AreaHectares: matchedParcel.AreaHectares,
                DataPrivacyNotice: "Under the Digital Personal Data Protection Act, individual landowner names, Aadhaar-linked PFMS tokens, and personal bank accounts are confidential. Please log in with your verified Citizen / Landowner credentials to access DBT payment receipts and R&R entitlement claims.",
                RequiresCitizenLogin: true
            );

            return Ok(ApiResponse<PublicInquiryResultDto>.Ok(result));
        }

        // Return gracefully without fabrication
        var notFoundResult = new PublicInquiryResultDto(
            Found: false,
            QueryEntered: query,
            SurveyNumber: null,
            VillageName: null,
            TehsilName: null,
            DistrictName: request.DistrictName,
            StateName: request.StateName,
            ProjectName: null,
            ImplementingAgency: null,
            AcquisitionStage: null,
            NotificationStatus: null,
            LandType: null,
            AreaHectares: null,
            DataPrivacyNotice: "No record found matching the specified Survey/Khasra number under current active acquisition notifications. Please verify your number or contact the local District Collectorate / Land Acquisition Officer.",
            RequiresCitizenLogin: true
        );

        return Ok(ApiResponse<PublicInquiryResultDto>.Ok(notFoundResult, "No matching land parcel record located."));
    }

    [HttpGet("notices")]
    public async Task<IActionResult> GetPublicNotices()
    {
        var proposals = await _context.Proposals
            .Include(p => p.Project)
                .ThenInclude(pr => pr.Organization)
            .Include(p => p.Project.State)
            .Include(p => p.Project.District)
            .OrderByDescending(p => p.CreatedAt)
            .Take(8)
            .ToListAsync();

        var notices = proposals.Select((p, idx) => new PublicNoticeDto(
            Id: p.Id,
            NoticeNumber: $"GOI/LARR/{p.CreatedAt.Year}/{p.ProposalNumber}",
            Title: $"Preliminary Land Acquisition Notification for {p.Project.Name}",
            ProjectName: p.Project.Name,
            ImplementingAgency: p.Project.Organization?.Name ?? "NHAI",
            StateName: p.Project.State?.Name ?? "Uttar Pradesh",
            DistrictName: p.Project.District?.Name ?? "Meerut",
            Stage: p.Status == ProposalStatus.Approved ? "Section 19 (Declaration of Award)" : "Section 11 (Preliminary Notification)",
            PublishedDate: p.CreatedAt,
            Summary: $"Notice under RFCTLARR Act 2013 for acquisition of approximately {p.Project.RequiredAreaHectares} Hectares in {p.Project.District?.Name ?? "Corridor Region"}."
        )).ToList();

        return Ok(ApiResponse<List<PublicNoticeDto>>.Ok(notices));
    }

    private static string GetNotificationStatusLabel(LandAcquisitionStatus status)
    {
        return status switch
        {
            LandAcquisitionStatus.Proposed => "Section 4 (Social Impact Assessment & Survey Proposed)",
            LandAcquisitionStatus.Surveyed => "Joint Cadastral Survey & Boundary Demarcation Complete",
            LandAcquisitionStatus.NotifiedSec4 => "Section 11 (Preliminary Acquisition Notification Published)",
            LandAcquisitionStatus.DeclarationSec19 => "Section 19 (Statutory Declaration of Acquisition)",
            LandAcquisitionStatus.Awarded => "Section 23/30 (Compensation Award Declared)",
            LandAcquisitionStatus.CompensationPaid => "Section 30 (Direct Benefit Transfer via PFMS Complete)",
            LandAcquisitionStatus.PossessionTaken => "Section 38 (Physical Possession Handed Over)",
            LandAcquisitionStatus.Disputed => "Under Statutory Grievance / Revenue Court Review",
            _ => "Statutory Review in Progress"
        };
    }
}
