using BhoomiSetu.Application.Common.Interfaces;
using BhoomiSetu.Application.Common.Models;
using BhoomiSetu.Application.DTOs;
using BhoomiSetu.Application.Services;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BhoomiSetu.API.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IApplicationDbContext _context;

    public AuthController(IMediator mediator, IApplicationDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _mediator.Send(new LoginCommand(request.Username, request.Password));
        if (!result.IsSuccess)
        {
            return BadRequest(ApiResponse<LoginResponseDto>.Fail(result.Message, result.Errors));
        }

        return Ok(ApiResponse<LoginResponseDto>.Ok(result.Data!, result.Message));
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
    {
        var result = await _mediator.Send(new RegisterCommand(request));
        if (!result.IsSuccess)
        {
            return BadRequest(ApiResponse<RegistrationResultDto>.Fail(result.Message, result.Errors));
        }

        return Ok(ApiResponse<RegistrationResultDto>.Ok(result.Data!, result.Message));
    }

    [HttpGet("roles")]
    [AllowAnonymous]
    public IActionResult GetRegisterableRoles()
    {
        var roles = new[]
        {
            new { 
                code = "CentralAdmin", 
                name = "Central Ministry Admin", 
                badge = "MoRTH / MoRD",
                description = "National Operations Command Center & Cross-State Corridor Tracking", 
                level = "National",
                icon = "🏛️"
            },
            new { 
                code = "StateAdmin", 
                name = "State Revenue Authority", 
                badge = "State Govt",
                description = "State Land Acquisition, Revenue Department & Compensation Oversight", 
                level = "State",
                icon = "🏢"
            },
            new { 
                code = "DistrictAdmin", 
                name = "District Collector / CALA", 
                badge = "District Administration",
                description = "Competent Authority for Land Acquisition, Survey & Award Declarations", 
                level = "District",
                icon = "📋"
            },
            new { 
                code = "ProjectAgency", 
                name = "Project Implementing Agency", 
                badge = "NHAI / DFCCIL / PWD",
                description = "Project Engineering, Alignment Surveys & Acquisition Proposals", 
                level = "Agency",
                icon = "🏗️"
            },
            new { 
                code = "Citizen", 
                name = "Citizen / Land Owner", 
                badge = "Public Portal",
                description = "Land Parcel Verification, Compensation Claims & R&R Grievances", 
                level = "Citizen",
                icon = "👤"
            }
        };

        return Ok(ApiResponse<object>.Ok(roles));
    }

    [HttpGet("geography")]
    [AllowAnonymous]
    public async Task<IActionResult> GetGeography()
    {
        var states = await _context.States
            .Include(s => s.Districts)
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new
            {
                id = s.Id,
                name = s.Name,
                code = s.Code,
                districts = s.Districts
                    .Where(d => d.IsActive)
                    .OrderBy(d => d.Name)
                    .Select(d => new
                    {
                        id = d.Id,
                        name = d.Name,
                        code = d.Code
                    }).ToList()
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(states));
    }
}

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _mediator.Send(new GetDashboardSummaryQuery());
        return Ok(ApiResponse<DashboardSummaryDto>.Ok(result.Data!));
    }
}
