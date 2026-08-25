using BhoomiSetu.Application.Common.Interfaces;
using BhoomiSetu.Application.Common.Models;
using BhoomiSetu.Application.DTOs;
using BhoomiSetu.Application.Services;
using BhoomiSetu.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BhoomiSetu.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetProjects([FromQuery] Guid? stateId, [FromQuery] Guid? districtId, [FromQuery] ProjectStatus? status)
    {
        var result = await _mediator.Send(new GetProjectsQuery(stateId, districtId, status));
        return Ok(ApiResponse<List<ProjectDto>>.Ok(result.Data!));
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class ProposalsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProposalsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetProposals([FromQuery] ProposalStatus? status)
    {
        var result = await _mediator.Send(new GetProposalsQuery(status));
        return Ok(ApiResponse<List<ProposalDto>>.Ok(result.Data!));
    }

    [HttpPost("{id}/review")]
    public async Task<IActionResult> ReviewProposal(Guid id, [FromBody] ProposalActionDto dto)
    {
        var result = await _mediator.Send(new ProcessProposalReviewCommand(id, dto.Action, dto.Comments));
        if (!result.IsSuccess) return BadRequest(ApiResponse<ProposalDto>.Fail(result.Message));
        return Ok(ApiResponse<ProposalDto>.Ok(result.Data!, result.Message));
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class GisController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public GisController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("parcels")]
    public async Task<IActionResult> GetLandParcels()
    {
        var parcels = await _context.LandParcels
            .Include(p => p.Project)
            .Include(p => p.State)
            .Include(p => p.District)
            .Include(p => p.Tehsil)
            .Include(p => p.Village)
            .Include(p => p.Owners)
            .Select(p => new LandParcelDto(
                p.Id,
                p.ProjectId,
                p.Project.Name,
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

        return Ok(ApiResponse<List<LandParcelDto>>.Ok(parcels));
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class CompensationController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public CompensationController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAssessments()
    {
        var assessments = await _context.CompensationAssessments
            .Include(ca => ca.Project)
            .Include(ca => ca.Parcel)
            .Include(ca => ca.AssessedBy)
            .Include(ca => ca.Payments)
            .Select(ca => new CompensationAssessmentDto(
                ca.Id,
                ca.ProjectId,
                ca.Project.Name,
                ca.ParcelId,
                ca.Parcel.SurveyNumber,
                ca.AssessedAmount,
                ca.SolatiumAmount,
                ca.InterestAmount,
                ca.TotalAmount,
                ca.Status,
                ca.AssessedBy.FirstName + " " + ca.AssessedBy.LastName,
                ca.AssessedAt,
                ca.Payments.Select(p => new CompensationPaymentDto(
                    p.Id,
                    p.PaymentReference,
                    p.Amount,
                    p.PaymentDate,
                    p.PaymentMethod,
                    p.Status,
                    p.Remarks
                )).ToList()
            ))
            .ToListAsync();

        return Ok(ApiResponse<List<CompensationAssessmentDto>>.Ok(assessments));
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class PossessionController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public PossessionController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPossessions()
    {
        var records = await _context.PossessionRecords
            .Include(pr => pr.Project)
            .Include(pr => pr.Parcel)
            .Include(pr => pr.VerifiedBy)
            .Select(pr => new PossessionRecordDto(
                pr.Id,
                pr.ProjectId,
                pr.Project.Name,
                pr.ParcelId,
                pr.Parcel.SurveyNumber,
                pr.Parcel.AreaHectares,
                pr.PossessionDate,
                pr.Status,
                "",
                pr.VerifiedBy != null ? pr.VerifiedBy.FirstName + " " + pr.VerifiedBy.LastName : "Pending",
                pr.Remarks
            ))
            .ToListAsync();

        return Ok(ApiResponse<List<PossessionRecordDto>>.Ok(records));
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class RehabilitationController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public RehabilitationController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAffectedFamilies()
    {
        var families = await _context.AffectedFamilies
            .Include(af => af.Project)
            .Include(af => af.Parcel)
            .Include(af => af.Village)
            .Include(af => af.RehabilitationCase)
                .ThenInclude(rc => rc!.Benefits)
            .Select(af => new AffectedFamilyDto(
                af.Id,
                af.ProjectId,
                af.Project.Name,
                af.ParcelId,
                af.Parcel != null ? af.Parcel.SurveyNumber : null,
                af.FamilyReference,
                af.HeadOfFamilyName,
                af.FamilySize,
                af.IsDisplaced,
                af.VillageId,
                af.Village.Name,
                af.RehabilitationCase != null ? new RehabilitationCaseDto(
                    af.RehabilitationCase.Id,
                    af.RehabilitationCase.Status,
                    af.RehabilitationCase.RehabilitationSite,
                    af.RehabilitationCase.EligibleAmount,
                    af.RehabilitationCase.ProvidedAmount,
                    af.RehabilitationCase.CompletionDate,
                    af.RehabilitationCase.Remarks,
                    af.RehabilitationCase.Benefits.Select(b => new RehabilitationBenefitDto(b.Id, b.BenefitType, b.Amount, b.ProvidedDate, b.Status)).ToList()
                ) : null
            ))
            .ToListAsync();

        return Ok(ApiResponse<List<AffectedFamilyDto>>.Ok(families));
    }
}
