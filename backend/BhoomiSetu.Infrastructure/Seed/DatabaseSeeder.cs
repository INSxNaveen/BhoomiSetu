using BhoomiSetu.Domain.Enums;
using BhoomiSetu.Domain.Geography;
using BhoomiSetu.Domain.Identity;
using BhoomiSetu.Domain.LandAcquisition;
using BhoomiSetu.Domain.Projects;
using BhoomiSetu.Domain.Proposals;
using BhoomiSetu.Infrastructure.Persistence;

namespace BhoomiSetu.Infrastructure.Seed;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        if (context.States.Any())
        {
            await SeedAdditionalStateDataAsync(context);
            await SeedAdditionalAgencyDataAsync(context);
            return;
        }

        #region 1. Geography (National Multi-State Coverage)
        var upState = new State { Id = Guid.NewGuid(), Code = "UP", Name = "Uttar Pradesh" };
        var mhState = new State { Id = Guid.NewGuid(), Code = "MH", Name = "Maharashtra" };
        var gjState = new State { Id = Guid.NewGuid(), Code = "GJ", Name = "Gujarat" };
        var rjState = new State { Id = Guid.NewGuid(), Code = "RJ", Name = "Rajasthan" };
        var brState = new State { Id = Guid.NewGuid(), Code = "BR", Name = "Bihar" };
        var kaState = new State { Id = Guid.NewGuid(), Code = "KA", Name = "Karnataka" };
        context.States.AddRange(upState, mhState, gjState, rjState, brState, kaState);

        var meerutDist = new District { Id = Guid.NewGuid(), StateId = upState.Id, Code = "UP-MRT", Name = "Meerut" };
        var gbnDist = new District { Id = Guid.NewGuid(), StateId = upState.Id, Code = "UP-GBN", Name = "Gautam Buddha Nagar" };
        var puneDist = new District { Id = Guid.NewGuid(), StateId = mhState.Id, Code = "MH-PNE", Name = "Pune" };
        var ahmdDist = new District { Id = Guid.NewGuid(), StateId = gjState.Id, Code = "GJ-AHD", Name = "Ahmedabad" };
        var jaipurDist = new District { Id = Guid.NewGuid(), StateId = rjState.Id, Code = "RJ-JPR", Name = "Jaipur" };
        var patnaDist = new District { Id = Guid.NewGuid(), StateId = brState.Id, Code = "BR-PAT", Name = "Patna" };
        var blrDist = new District { Id = Guid.NewGuid(), StateId = kaState.Id, Code = "KA-BLR", Name = "Bengaluru Urban" };
        context.Districts.AddRange(meerutDist, gbnDist, puneDist, ahmdDist, jaipurDist, patnaDist, blrDist);

        var meerutTehsil = new Tehsil { Id = Guid.NewGuid(), DistrictId = meerutDist.Id, Name = "Meerut Sadar" };
        var puneTehsil = new Tehsil { Id = Guid.NewGuid(), DistrictId = puneDist.Id, Name = "Haveli" };
        var ahmdTehsil = new Tehsil { Id = Guid.NewGuid(), DistrictId = ahmdDist.Id, Name = "Daskroi" };
        context.Tehsils.AddRange(meerutTehsil, puneTehsil, ahmdTehsil);

        var dabathwaVillage = new Village { Id = Guid.NewGuid(), TehsilId = meerutTehsil.Id, Name = "Dabathwa" };
        var siwalVillage = new Village { Id = Guid.NewGuid(), TehsilId = meerutTehsil.Id, Name = "Siwal Khas" };
        var puneVillage = new Village { Id = Guid.NewGuid(), TehsilId = puneTehsil.Id, Name = "Khadakwasla" };
        var ahmdVillage = new Village { Id = Guid.NewGuid(), TehsilId = ahmdTehsil.Id, Name = "Sanand" };
        context.Villages.AddRange(dabathwaVillage, siwalVillage, puneVillage, ahmdVillage);
        #endregion

        #region 2. Organizations
        var centralOrg = new Organization { Id = Guid.NewGuid(), Name = "Ministry of Road Transport & Highways (MoRTH)", Code = "MORTH", OrganizationType = OrganizationType.CentralMinistry };
        var stateOrg = new Organization { Id = Guid.NewGuid(), Name = "UP Public Works Department", Code = "UP-PWD", OrganizationType = OrganizationType.StateGovernment, StateId = upState.Id };
        var distOrg = new Organization { Id = Guid.NewGuid(), Name = "District Collectorate Meerut", Code = "DC-MRT", OrganizationType = OrganizationType.DistrictAdministration, StateId = upState.Id, DistrictId = meerutDist.Id };
        var agencyOrg = new Organization { Id = Guid.NewGuid(), Name = "National Highways Authority of India (NHAI)", Code = "NHAI", OrganizationType = OrganizationType.ProjectAgency };
        var railOrg = new Organization { Id = Guid.NewGuid(), Name = "Dedicated Freight Corridor Corporation (DFCCIL)", Code = "DFCCIL", OrganizationType = OrganizationType.ProjectAgency };
        context.Organizations.AddRange(centralOrg, stateOrg, distOrg, agencyOrg, railOrg);
        #endregion

        #region 3. Roles & Permissions
        var roles = new[]
        {
            new Role { Id = Guid.NewGuid(), Name = "SuperAdmin", Description = "System Administrator" },
            new Role { Id = Guid.NewGuid(), Name = "CentralAdmin", Description = "National Monitoring Admin" },
            new Role { Id = Guid.NewGuid(), Name = "StateAdmin", Description = "State Review & Approval Officer" },
            new Role { Id = Guid.NewGuid(), Name = "DistrictAdmin", Description = "District Collector / Land Acquisition Collector" },
            new Role { Id = Guid.NewGuid(), Name = "ProjectAgency", Description = "Project Implementing Agency User" },
            new Role { Id = Guid.NewGuid(), Name = "Citizen", Description = "Citizen / Landowner (Direct Benefit Tracking)" }
        };
        context.Roles.AddRange(roles);

        var superRole = roles.First(r => r.Name == "SuperAdmin");
        var centralRole = roles.First(r => r.Name == "CentralAdmin");
        var stateRole = roles.First(r => r.Name == "StateAdmin");
        var distRole = roles.First(r => r.Name == "DistrictAdmin");
        var agencyRole = roles.First(r => r.Name == "ProjectAgency");
        var citizenRole = roles.First(r => r.Name == "Citizen");

        var permissions = new[]
        {
            new Permission { Id = Guid.NewGuid(), Code = "project.view", Name = "View Projects", Module = "Projects" },
            new Permission { Id = Guid.NewGuid(), Code = "project.create", Name = "Create Project", Module = "Projects" },
            new Permission { Id = Guid.NewGuid(), Code = "proposal.view", Name = "View Proposals", Module = "Proposals" },
            new Permission { Id = Guid.NewGuid(), Code = "proposal.submit", Name = "Submit Proposal", Module = "Proposals" },
            new Permission { Id = Guid.NewGuid(), Code = "proposal.verify", Name = "Verify Proposal", Module = "Proposals" },
            new Permission { Id = Guid.NewGuid(), Code = "proposal.approve", Name = "Approve Proposal", Module = "Proposals" },
            new Permission { Id = Guid.NewGuid(), Code = "gis.view", Name = "View GIS Maps", Module = "GIS" },
            new Permission { Id = Guid.NewGuid(), Code = "compensation.view", Name = "View Compensation", Module = "Compensation" },
            new Permission { Id = Guid.NewGuid(), Code = "compensation.pay", Name = "Record Payment", Module = "Compensation" },
            new Permission { Id = Guid.NewGuid(), Code = "possession.view", Name = "View Possession", Module = "Possession" },
            new Permission { Id = Guid.NewGuid(), Code = "possession.record", Name = "Record Possession", Module = "Possession" },
            new Permission { Id = Guid.NewGuid(), Code = "rehabilitation.view", Name = "View R&R", Module = "R&R" },
            new Permission { Id = Guid.NewGuid(), Code = "report.view", Name = "View Reports", Module = "Reports" }
        };
        context.Permissions.AddRange(permissions);

        foreach (var p in permissions)
        {
            context.RolePermissions.Add(new RolePermission { RoleId = superRole.Id, PermissionId = p.Id });
            context.RolePermissions.Add(new RolePermission { RoleId = centralRole.Id, PermissionId = p.Id });
        }

        foreach (var p in permissions.Where(x => x.Code != "proposal.submit"))
            context.RolePermissions.Add(new RolePermission { RoleId = stateRole.Id, PermissionId = p.Id });

        foreach (var p in permissions.Where(x => x.Code != "proposal.approve"))
            context.RolePermissions.Add(new RolePermission { RoleId = distRole.Id, PermissionId = p.Id });

        foreach (var p in permissions.Where(x => x.Code is "project.view" or "project.create" or "proposal.view" or "proposal.submit" or "gis.view" or "compensation.view" or "possession.view" or "rehabilitation.view"))
            context.RolePermissions.Add(new RolePermission { RoleId = agencyRole.Id, PermissionId = p.Id });

        foreach (var p in permissions.Where(x => x.Code is "gis.view" or "compensation.view" or "possession.view" or "rehabilitation.view" or "report.view"))
            context.RolePermissions.Add(new RolePermission { RoleId = citizenRole.Id, PermissionId = p.Id });
        #endregion

        #region 4. Seeded Administrative & Citizen Users
        var superUser = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = centralOrg.Id,
            Username = "super.admin",
            PasswordHash = "Admin@123",
            Email = "admin@bhoomisetu.gov.in",
            FirstName = "Super",
            LastName = "Admin",
            Phone = "+91 9876543210"
        };
        var centralUser = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = centralOrg.Id,
            Username = "central.admin",
            PasswordHash = "Central@123",
            Email = "central@morth.gov.in",
            FirstName = "Rajesh",
            LastName = "Sharma",
            Phone = "+91 9876543211"
        };
        var stateUser = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = stateOrg.Id,
            StateId = upState.Id,
            Username = "state.admin",
            PasswordHash = "State@123",
            Email = "state@up.gov.in",
            FirstName = "Vikram",
            LastName = "Singh",
            Phone = "+91 9876543212"
        };
        var distUser = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = distOrg.Id,
            StateId = upState.Id,
            DistrictId = meerutDist.Id,
            Username = "district.admin",
            PasswordHash = "District@123",
            Email = "dc@meerut.gov.in",
            FirstName = "Amit",
            LastName = "Verma",
            Phone = "+91 9876543213"
        };
        var agencyUser = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = agencyOrg.Id,
            Username = "agency.user",
            PasswordHash = "Agency@123",
            Email = "project@nhai.gov.in",
            FirstName = "Suresh",
            LastName = "Kumar",
            Phone = "+91 9876543214"
        };
        var citizenUser = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = distOrg.Id,
            StateId = upState.Id,
            DistrictId = meerutDist.Id,
            Username = "citizen.user",
            PasswordHash = "Citizen@123",
            Email = "ramesh.sharma@gmail.com",
            FirstName = "Ramesh",
            LastName = "Sharma",
            Phone = "+91 9876543215"
        };

        context.Users.AddRange(superUser, centralUser, stateUser, distUser, agencyUser, citizenUser);
        context.UserRoles.Add(new UserRole { UserId = superUser.Id, RoleId = superRole.Id });
        context.UserRoles.Add(new UserRole { UserId = centralUser.Id, RoleId = centralRole.Id });
        context.UserRoles.Add(new UserRole { UserId = stateUser.Id, RoleId = stateRole.Id });
        context.UserRoles.Add(new UserRole { UserId = distUser.Id, RoleId = distRole.Id });
        context.UserRoles.Add(new UserRole { UserId = agencyUser.Id, RoleId = agencyRole.Id });
        context.UserRoles.Add(new UserRole { UserId = citizenUser.Id, RoleId = citizenRole.Id });
        #endregion

        #region 5. Multi-State National Projects across India
        // Project 1: Uttar Pradesh (Expressway)
        var project1 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "NH-48-EXP-01",
            Name = "NH-48 Delhi-Meerut Expressway Expansion Phase 3",
            Description = "Widening and construction of 6-lane access-controlled expressway bypass through Meerut district.",
            ProjectType = ProjectType.NationalHighway,
            OrganizationId = agencyOrg.Id,
            StateId = upState.Id,
            DistrictId = meerutDist.Id,
            EstimatedCost = 450000000.00m,
            RequiredAreaHectares = 124.50m,
            Status = ProjectStatus.PossessionPhase,
            StartDate = DateTime.UtcNow.AddMonths(-12),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(8)
        };
        project1.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "Joint Measurement Survey (JMS)", PlannedDate = DateTime.UtcNow.AddMonths(-10), ActualDate = DateTime.UtcNow.AddMonths(-10), Status = "Completed", SequenceNumber = 1 });
        project1.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "Section 11 Preliminary Notification", PlannedDate = DateTime.UtcNow.AddMonths(-8), ActualDate = DateTime.UtcNow.AddMonths(-8), Status = "Completed", SequenceNumber = 2 });
        project1.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "Section 19 Declaration of Acquisition", PlannedDate = DateTime.UtcNow.AddMonths(-5), ActualDate = DateTime.UtcNow.AddMonths(-5), Status = "Completed", SequenceNumber = 3 });
        project1.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "Final Award & DBT Disbursement", PlannedDate = DateTime.UtcNow.AddMonths(-2), ActualDate = DateTime.UtcNow.AddMonths(-1), Status = "Completed", SequenceNumber = 4 });
        project1.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project1.Id, Name = "Possession Handover", PlannedDate = DateTime.UtcNow.AddMonths(2), Status = "InProgress", SequenceNumber = 5 });

        // Project 2: Maharashtra (Ring Road)
        var project2 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "MH-PNE-RR-02",
            Name = "Pune Ring Road Western Alignment Section 2",
            Description = "Construction of high-speed bypass ring road connecting Haveli to Khadakwasla in Pune district.",
            ProjectType = ProjectType.NationalHighway,
            OrganizationId = agencyOrg.Id,
            StateId = mhState.Id,
            DistrictId = puneDist.Id,
            EstimatedCost = 780000000.00m,
            RequiredAreaHectares = 210.00m,
            Status = ProjectStatus.AcquisitionInProgress,
            StartDate = DateTime.UtcNow.AddMonths(-8),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(14)
        };
        project2.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project2.Id, Name = "Joint Measurement Survey", PlannedDate = DateTime.UtcNow.AddMonths(-6), ActualDate = DateTime.UtcNow.AddMonths(-6), Status = "Completed", SequenceNumber = 1 });
        project2.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project2.Id, Name = "Section 11 Gazette Notification", PlannedDate = DateTime.UtcNow.AddMonths(-4), ActualDate = DateTime.UtcNow.AddMonths(-4), Status = "Completed", SequenceNumber = 2 });
        project2.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project2.Id, Name = "Compensation Valuation", PlannedDate = DateTime.UtcNow.AddMonths(1), Status = "InProgress", SequenceNumber = 3 });

        // Project 3: Gujarat (Freight Corridor - Completed)
        var project3 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "WDFC-GJ-SEC04",
            Name = "Western Dedicated Freight Corridor (WDFC) Sanand-Ahmedabad Link",
            Description = "Double-line electric rail freight corridor linking industrial logistics hubs in Sanand and Ahmedabad.",
            ProjectType = ProjectType.RailwayLine,
            OrganizationId = railOrg.Id,
            StateId = gjState.Id,
            DistrictId = ahmdDist.Id,
            EstimatedCost = 1250000000.00m,
            RequiredAreaHectares = 340.00m,
            Status = ProjectStatus.Completed,
            StartDate = DateTime.UtcNow.AddMonths(-24),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(-2)
        };
        project3.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project3.Id, Name = "Land Acquisition Complete", PlannedDate = DateTime.UtcNow.AddMonths(-6), ActualDate = DateTime.UtcNow.AddMonths(-5), Status = "Completed", SequenceNumber = 1 });
        project3.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project3.Id, Name = "Final Handover to Railways", PlannedDate = DateTime.UtcNow.AddMonths(-2), ActualDate = DateTime.UtcNow.AddMonths(-2), Status = "Completed", SequenceNumber = 2 });

        // Project 4: Rajasthan (Solar Corridor - Delayed by 27 days)
        var project4 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "SOL-RJ-JPR-01",
            Name = "Jaipur-Bikaner Green Energy Transmission Corridor",
            Description = "Acquisition of desert and rural right-of-way for 765kV green power grid evacuation lines.",
            ProjectType = ProjectType.PowerAndEnergy,
            OrganizationId = agencyOrg.Id,
            StateId = rjState.Id,
            DistrictId = jaipurDist.Id,
            EstimatedCost = 320000000.00m,
            RequiredAreaHectares = 190.00m,
            Status = ProjectStatus.UnderVerification,
            StartDate = DateTime.UtcNow.AddMonths(-5),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(12)
        };
        // Milestone planned 27 days ago, but pending
        project4.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project4.Id, Name = "Section 11 Preliminary Notification", PlannedDate = DateTime.UtcNow.AddDays(-27), Status = "Delayed", SequenceNumber = 1 });
        project4.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project4.Id, Name = "Objection Hearing & Verification", PlannedDate = DateTime.UtcNow.AddDays(30), Status = "Pending", SequenceNumber = 2 });

        // Project 5: Bihar (Freight Corridor - Delayed by 42 days)
        var project5 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "EDFC-BR-PAT-03",
            Name = "Eastern Dedicated Freight Corridor Sonnagar-Dankuni Bihar Section",
            Description = "Dedicated freight line acquisition through Patna and central Bihar rural tracts.",
            ProjectType = ProjectType.RailwayLine,
            OrganizationId = railOrg.Id,
            StateId = brState.Id,
            DistrictId = patnaDist.Id,
            EstimatedCost = 950000000.00m,
            RequiredAreaHectares = 280.00m,
            Status = ProjectStatus.CompensationPhase,
            StartDate = DateTime.UtcNow.AddMonths(-10),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(10)
        };
        // Milestone planned 42 days ago, but pending
        project5.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project5.Id, Name = "Final Award Declaration", PlannedDate = DateTime.UtcNow.AddDays(-42), Status = "Delayed", SequenceNumber = 1 });
        project5.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project5.Id, Name = "Compensation Disbursement", PlannedDate = DateTime.UtcNow.AddDays(20), Status = "Pending", SequenceNumber = 2 });

        // Project 6: Karnataka (Ring Road - Proposed)
        var project6 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "KA-BLR-STRR-01",
            Name = "Bengaluru Satellite Town Ring Road (STRR) Package 1",
            Description = "Construction of 4/6-lane expressway bypass connecting Dobbaspet to Hoskote in Bengaluru peripheral district.",
            ProjectType = ProjectType.NationalHighway,
            OrganizationId = agencyOrg.Id,
            StateId = kaState.Id,
            DistrictId = blrDist.Id,
            EstimatedCost = 620000000.00m,
            RequiredAreaHectares = 165.00m,
            Status = ProjectStatus.ProposalSubmitted,
            StartDate = DateTime.UtcNow.AddMonths(-2),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(20)
        };
        project6.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = project6.Id, Name = "Administrative Proposal Review", PlannedDate = DateTime.UtcNow.AddDays(15), Status = "Pending", SequenceNumber = 1 });

        context.Projects.AddRange(project1, project2, project3, project4, project5, project6);
        #endregion

        #region 6. Proposals
        var proposal1 = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = "PROP-2026-UP-001024",
            ProjectId = project1.Id,
            SubmittedById = agencyUser.Id,
            SubmittedAt = DateTime.UtcNow.AddMonths(-4),
            Status = ProposalStatus.Approved,
            LandAreaProposed = 124.50m,
            AffectedFamilyCount = 42,
            EstimatedCompensation = 185000000.00m,
            CurrentStage = "Sanctioned & Land Acquisition Active"
        };
        var proposal2 = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = "PROP-2026-MH-002048",
            ProjectId = project2.Id,
            SubmittedById = agencyUser.Id,
            SubmittedAt = DateTime.UtcNow.AddMonths(-3),
            Status = ProposalStatus.Approved,
            LandAreaProposed = 210.00m,
            AffectedFamilyCount = 58,
            EstimatedCompensation = 260000000.00m,
            CurrentStage = "Valuation & Joint Measurement"
        };
        var proposal3 = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = "PROP-2026-BR-003012",
            ProjectId = project5.Id,
            SubmittedById = agencyUser.Id,
            SubmittedAt = DateTime.UtcNow.AddMonths(-6),
            Status = ProposalStatus.StateReview,
            LandAreaProposed = 280.00m,
            AffectedFamilyCount = 92,
            EstimatedCompensation = 340000000.00m,
            CurrentStage = "State Review & Compensation Sanction"
        };
        var proposal4 = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = "PROP-2026-RJ-004055",
            ProjectId = project4.Id,
            SubmittedById = agencyUser.Id,
            SubmittedAt = DateTime.UtcNow.AddMonths(-2),
            Status = ProposalStatus.DistrictVerification,
            LandAreaProposed = 190.00m,
            AffectedFamilyCount = 24,
            EstimatedCompensation = 140000000.00m,
            CurrentStage = "District Field Verification"
        };
        var proposal5 = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = "PROP-2026-KA-005088",
            ProjectId = project6.Id,
            SubmittedById = agencyUser.Id,
            SubmittedAt = DateTime.UtcNow.AddDays(-20),
            Status = ProposalStatus.Submitted,
            LandAreaProposed = 165.00m,
            AffectedFamilyCount = 35,
            EstimatedCompensation = 220000000.00m,
            CurrentStage = "Initial Proposal Submitted"
        };
        context.Proposals.AddRange(proposal1, proposal2, proposal3, proposal4, proposal5);
        #endregion

        #region 7. Land Parcels & PostGIS / GeoJSON Data
        var parcel1 = new LandParcel
        {
            Id = Guid.NewGuid(),
            ProjectId = project1.Id,
            StateId = upState.Id,
            DistrictId = meerutDist.Id,
            TehsilId = meerutTehsil.Id,
            VillageId = dabathwaVillage.Id,
            SurveyNumber = "245/1A",
            ParcelNumber = "PARCEL-UP-001",
            AreaHectares = 4.25m,
            LandType = "Agricultural",
            AcquisitionStatus = LandAcquisitionStatus.PossessionTaken,
            Latitude = 28.9845,
            Longitude = 77.7064,
            GeoJsonGeometry = "{\"type\":\"Polygon\",\"coordinates\":[[[77.705,28.983],[77.708,28.983],[77.708,28.986],[77.705,28.986],[77.705,28.983]]]}"
        };
        var parcel2 = new LandParcel
        {
            Id = Guid.NewGuid(),
            ProjectId = project1.Id,
            StateId = upState.Id,
            DistrictId = meerutDist.Id,
            TehsilId = meerutTehsil.Id,
            VillageId = siwalVillage.Id,
            SurveyNumber = "112/3B",
            ParcelNumber = "PARCEL-UP-002",
            AreaHectares = 6.80m,
            LandType = "Agricultural",
            AcquisitionStatus = LandAcquisitionStatus.CompensationPaid,
            Latitude = 28.9912,
            Longitude = 77.7125,
            GeoJsonGeometry = "{\"type\":\"Polygon\",\"coordinates\":[[[77.710,28.990],[77.715,28.990],[77.715,28.994],[77.710,28.994],[77.710,28.990]]]}"
        };
        var parcel3 = new LandParcel
        {
            Id = Guid.NewGuid(),
            ProjectId = project2.Id,
            StateId = mhState.Id,
            DistrictId = puneDist.Id,
            TehsilId = puneTehsil.Id,
            VillageId = puneVillage.Id,
            SurveyNumber = "88/4C",
            ParcelNumber = "PARCEL-MH-001",
            AreaHectares = 8.50m,
            LandType = "Agricultural",
            AcquisitionStatus = LandAcquisitionStatus.Surveyed,
            Latitude = 18.5204,
            Longitude = 73.8567,
            GeoJsonGeometry = "{\"type\":\"Polygon\",\"coordinates\":[[[73.850,18.518],[73.858,18.518],[73.858,18.524],[73.850,18.524],[73.850,18.518]]]}"
        };
        var parcel4 = new LandParcel
        {
            Id = Guid.NewGuid(),
            ProjectId = project3.Id,
            StateId = gjState.Id,
            DistrictId = ahmdDist.Id,
            TehsilId = ahmdTehsil.Id,
            VillageId = ahmdVillage.Id,
            SurveyNumber = "502/1",
            ParcelNumber = "PARCEL-GJ-001",
            AreaHectares = 14.20m,
            LandType = "Commercial",
            AcquisitionStatus = LandAcquisitionStatus.PossessionTaken,
            Latitude = 22.3072,
            Longitude = 73.1812,
            GeoJsonGeometry = "{\"type\":\"Polygon\",\"coordinates\":[[[73.175,22.302],[73.185,22.302],[73.185,22.310],[73.175,22.310],[73.175,22.302]]]}"
        };
        context.LandParcels.AddRange(parcel1, parcel2, parcel3, parcel4);

        context.ParcelOwners.Add(new ParcelOwner { Id = Guid.NewGuid(), ParcelId = parcel1.Id, OwnerName = "Ramesh Chand Tyagi", OwnershipPercentage = 100m, IsPrimaryOwner = true, ContactPhone = "+91 9412345678" });
        context.ParcelOwners.Add(new ParcelOwner { Id = Guid.NewGuid(), ParcelId = parcel2.Id, OwnerName = "Satyapal Singh", OwnershipPercentage = 100m, IsPrimaryOwner = true, ContactPhone = "+91 9412345679" });
        context.ParcelOwners.Add(new ParcelOwner { Id = Guid.NewGuid(), ParcelId = parcel3.Id, OwnerName = "Ganesh Patil", OwnershipPercentage = 100m, IsPrimaryOwner = true, ContactPhone = "+91 9822345670" });
        context.ParcelOwners.Add(new ParcelOwner { Id = Guid.NewGuid(), ParcelId = parcel4.Id, OwnerName = "Bharatbhai Patel", OwnershipPercentage = 100m, IsPrimaryOwner = true, ContactPhone = "+91 9898345671" });
        #endregion

        #region 8. Compensation, Possession & R&R
        var comp1 = new CompensationAssessment
        {
            Id = Guid.NewGuid(),
            ProjectId = project1.Id,
            ParcelId = parcel1.Id,
            AssessedAmount = 12000000m,
            SolatiumAmount = 12000000m,
            InterestAmount = 2400000m,
            TotalAmount = 26400000m,
            Status = CompensationStatus.Disbursed,
            AssessedById = distUser.Id,
            AssessedAt = DateTime.UtcNow.AddMonths(-2)
        };
        var comp2 = new CompensationAssessment
        {
            Id = Guid.NewGuid(),
            ProjectId = project1.Id,
            ParcelId = parcel2.Id,
            AssessedAmount = 18000000m,
            SolatiumAmount = 18000000m,
            InterestAmount = 3600000m,
            TotalAmount = 39600000m,
            Status = CompensationStatus.Disbursed,
            AssessedById = distUser.Id,
            AssessedAt = DateTime.UtcNow.AddMonths(-2)
        };
        var comp3 = new CompensationAssessment
        {
            Id = Guid.NewGuid(),
            ProjectId = project2.Id,
            ParcelId = parcel3.Id,
            AssessedAmount = 45000000m,
            SolatiumAmount = 45000000m,
            InterestAmount = 9000000m,
            TotalAmount = 99000000m,
            Status = CompensationStatus.Approved,
            AssessedById = distUser.Id,
            AssessedAt = DateTime.UtcNow.AddMonths(-1)
        };
        var comp4 = new CompensationAssessment
        {
            Id = Guid.NewGuid(),
            ProjectId = project3.Id,
            ParcelId = parcel4.Id,
            AssessedAmount = 75000000m,
            SolatiumAmount = 75000000m,
            InterestAmount = 15000000m,
            TotalAmount = 165000000m,
            Status = CompensationStatus.Disbursed,
            AssessedById = distUser.Id,
            AssessedAt = DateTime.UtcNow.AddMonths(-8)
        };
        context.CompensationAssessments.AddRange(comp1, comp2, comp3, comp4);

        context.CompensationPayments.Add(new CompensationPayment { Id = Guid.NewGuid(), AssessmentId = comp1.Id, PaymentReference = "DBT-2026-MRT-998811", Amount = 26400000m, PaymentDate = DateTime.UtcNow.AddMonths(-1), PaymentMethod = "DBT Direct Bank Transfer", Status = "Completed", Remarks = "Direct Benefit Transfer credited to SBI Account ending in 4512" });
        context.CompensationPayments.Add(new CompensationPayment { Id = Guid.NewGuid(), AssessmentId = comp2.Id, PaymentReference = "DBT-2026-MRT-998812", Amount = 39600000m, PaymentDate = DateTime.UtcNow.AddDays(-20), PaymentMethod = "DBT Direct Bank Transfer", Status = "Completed", Remarks = "Direct Benefit Transfer credited to PNB Account ending in 8831" });
        context.CompensationPayments.Add(new CompensationPayment { Id = Guid.NewGuid(), AssessmentId = comp4.Id, PaymentReference = "DBT-2026-GJ-443322", Amount = 165000000m, PaymentDate = DateTime.UtcNow.AddMonths(-6), PaymentMethod = "DBT Direct Bank Transfer", Status = "Completed", Remarks = "Direct Benefit Transfer credited to Bank of Baroda" });

        context.PossessionRecords.Add(new PossessionRecord { Id = Guid.NewGuid(), ProjectId = project1.Id, ParcelId = parcel1.Id, PossessionDate = DateTime.UtcNow.AddDays(-15), Status = PossessionStatus.PossessionTaken, VerifiedById = distUser.Id, Remarks = "Physical possession taken and revenue map updated." });
        context.PossessionRecords.Add(new PossessionRecord { Id = Guid.NewGuid(), ProjectId = project3.Id, ParcelId = parcel4.Id, PossessionDate = DateTime.UtcNow.AddMonths(-4), Status = PossessionStatus.PossessionTaken, VerifiedById = distUser.Id, Remarks = "Handover complete to DFCCIL." });

        var family1 = new AffectedFamily { Id = Guid.NewGuid(), ProjectId = project1.Id, ParcelId = parcel1.Id, FamilyReference = "FAM-2026-UP-001", HeadOfFamilyName = "Ramesh Chand Tyagi", FamilySize = 6, IsDisplaced = true, VillageId = dabathwaVillage.Id };
        var family2 = new AffectedFamily { Id = Guid.NewGuid(), ProjectId = project2.Id, ParcelId = parcel3.Id, FamilyReference = "FAM-2026-MH-002", HeadOfFamilyName = "Ganesh Patil", FamilySize = 5, IsDisplaced = true, VillageId = puneVillage.Id };
        var family3 = new AffectedFamily { Id = Guid.NewGuid(), ProjectId = project3.Id, ParcelId = parcel4.Id, FamilyReference = "FAM-2026-GJ-003", HeadOfFamilyName = "Bharatbhai Patel", FamilySize = 4, IsDisplaced = false, VillageId = ahmdVillage.Id };
        context.AffectedFamilies.AddRange(family1, family2, family3);

        var rehab1 = new RehabilitationCase { Id = Guid.NewGuid(), AffectedFamilyId = family1.Id, Status = RehabilitationStatus.Completed, RehabilitationSite = "Resettlement Colony Sector 4, Meerut", EligibleAmount = 500000m, ProvidedAmount = 500000m, CompletionDate = DateTime.UtcNow.AddDays(-10), Remarks = "Housing grant provided and possession of plot delivered." };
        var rehab2 = new RehabilitationCase { Id = Guid.NewGuid(), AffectedFamilyId = family2.Id, Status = RehabilitationStatus.PackageApproved, RehabilitationSite = "PMC Resettlement Zone, Pune", EligibleAmount = 600000m, ProvidedAmount = 300000m, Remarks = "Initial subsistence grant disbursed; house construction underway." };
        context.RehabilitationCases.AddRange(rehab1, rehab2);

        context.RehabilitationBenefits.Add(new RehabilitationBenefit { Id = Guid.NewGuid(), RehabilitationCaseId = rehab1.Id, BenefitType = "Constructed House Plot Allotment", Amount = 350000m, ProvidedDate = DateTime.UtcNow.AddDays(-15), Status = "Disbursed" });
        context.RehabilitationBenefits.Add(new RehabilitationBenefit { Id = Guid.NewGuid(), RehabilitationCaseId = rehab1.Id, BenefitType = "One-Time Resettlement Allowance", Amount = 150000m, ProvidedDate = DateTime.UtcNow.AddDays(-10), Status = "Disbursed" });
        context.RehabilitationBenefits.Add(new RehabilitationBenefit { Id = Guid.NewGuid(), RehabilitationCaseId = rehab2.Id, BenefitType = "Subsistence Allowance (1st Tranche)", Amount = 300000m, ProvidedDate = DateTime.UtcNow.AddDays(-20), Status = "Disbursed" });
        #endregion

        await context.SaveChangesAsync();
    }

    public static async Task SeedAdditionalStateDataAsync(ApplicationDbContext context)
    {
        var upState = context.States.FirstOrDefault(s => s.Code == "UP");
        if (upState == null) return;

        var gbnDist = context.Districts.FirstOrDefault(d => d.Code == "UP-GBN");
        var meerutDist = context.Districts.FirstOrDefault(d => d.Code == "UP-MRT");
        if (gbnDist == null || meerutDist == null) return;

        var agencyOrg = context.Organizations.FirstOrDefault(o => o.Code == "NHAI");
        var agencyUser = context.Users.FirstOrDefault(u => u.Username == "agency.user");
        var distUser = context.Users.FirstOrDefault(u => u.Username == "district.admin");
        if (agencyOrg == null || agencyUser == null || distUser == null) return;

        if (context.Proposals.Count(p => p.Project.StateId == upState.Id) >= 4) return;

        // Project UP 2: Greater Noida Industrial Logistics Hub (State Review)
        var projectUp2 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "LOG-UP-GBN-02",
            Name = "Greater Noida Multi-Modal Logistics & Freight Hub",
            Description = "Acquisition of 85 hectares of rural and peri-urban land in Jewar/Greater Noida peripheral corridor for national logistics park.",
            ProjectType = ProjectType.IndustrialCorridor,
            OrganizationId = agencyOrg.Id,
            StateId = upState.Id,
            DistrictId = gbnDist.Id,
            EstimatedCost = 480000000.00m,
            RequiredAreaHectares = 85.00m,
            Status = ProjectStatus.UnderVerification,
            StartDate = DateTime.UtcNow.AddMonths(-3),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(18)
        };
        projectUp2.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = projectUp2.Id, Name = "Administrative Scrutiny & Field Report", PlannedDate = DateTime.UtcNow.AddDays(-10), ActualDate = DateTime.UtcNow.AddDays(-5), Status = "Completed", SequenceNumber = 1 });
        projectUp2.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = projectUp2.Id, Name = "State Competent Authority Sanction", PlannedDate = DateTime.UtcNow.AddDays(5), Status = "Pending", SequenceNumber = 2 });

        // Project UP 3: Meerut Outer Ring Road Phase 2 (District Verification)
        var projectUp3 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "NHAI-UP-MRT-04",
            Name = "Meerut Northern Bypass & Outer Ring Road Phase 2",
            Description = "Construction of 4-lane bypass connecting Roorkee Road to Garh Mukteshwar Highway around Meerut urban periphery.",
            ProjectType = ProjectType.NationalHighway,
            OrganizationId = agencyOrg.Id,
            StateId = upState.Id,
            DistrictId = meerutDist.Id,
            EstimatedCost = 350000000.00m,
            RequiredAreaHectares = 42.00m,
            Status = ProjectStatus.ProposalSubmitted,
            StartDate = DateTime.UtcNow.AddMonths(-1),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(14)
        };

        // Project UP 4: Western UP Agro-Processing Industrial Park (Returned for Correction)
        var projectUp4 = new Project
        {
            Id = Guid.NewGuid(),
            ProjectCode = "AGRO-UP-MRT-01",
            Name = "Western UP Mega Food & Agro Logistics Complex",
            Description = "Integrated cold storage, grain silo terminal, and processing facility land acquisition in Daurala tehsil.",
            ProjectType = ProjectType.IndustrialCorridor,
            OrganizationId = agencyOrg.Id,
            StateId = upState.Id,
            DistrictId = meerutDist.Id,
            EstimatedCost = 280000000.00m,
            RequiredAreaHectares = 55.00m,
            Status = ProjectStatus.ProposalSubmitted,
            StartDate = DateTime.UtcNow.AddMonths(-4),
            TargetCompletionDate = DateTime.UtcNow.AddMonths(12)
        };
        projectUp4.Milestones.Add(new ProjectMilestone { Id = Guid.NewGuid(), ProjectId = projectUp4.Id, Name = "Environmental Impact Assessment Resubmission", PlannedDate = DateTime.UtcNow.AddDays(-15), Status = "Delayed", SequenceNumber = 1 });

        context.Projects.AddRange(projectUp2, projectUp3, projectUp4);

        // Proposals
        var propUp2 = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = "PROP-2026-UP-002049",
            ProjectId = projectUp2.Id,
            SubmittedById = agencyUser.Id,
            SubmittedAt = DateTime.UtcNow.AddMonths(-1),
            Status = ProposalStatus.StateReview,
            LandAreaProposed = 85.00m,
            AffectedFamilyCount = 28,
            EstimatedCompensation = 124000000.00m,
            CurrentStage = "State Review & Administrative Sanction"
        };

        var propUp3 = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = "PROP-2026-UP-003088",
            ProjectId = projectUp3.Id,
            SubmittedById = agencyUser.Id,
            SubmittedAt = DateTime.UtcNow.AddDays(-18),
            Status = ProposalStatus.DistrictVerification,
            LandAreaProposed = 42.00m,
            AffectedFamilyCount = 14,
            EstimatedCompensation = 68000000.00m,
            CurrentStage = "District Field Verification & Khasra Survey"
        };

        var propUp4 = new Proposal
        {
            Id = Guid.NewGuid(),
            ProposalNumber = "PROP-2026-UP-004011",
            ProjectId = projectUp4.Id,
            SubmittedById = agencyUser.Id,
            SubmittedAt = DateTime.UtcNow.AddMonths(-2),
            Status = ProposalStatus.ReturnedForCorrection,
            LandAreaProposed = 55.00m,
            AffectedFamilyCount = 19,
            EstimatedCompensation = 82000000.00m,
            CurrentStage = "Returned to District: Environmental & Social Impact Clearance Resubmission Required"
        };

        context.Proposals.AddRange(propUp2, propUp3, propUp4);

        // Parcels for Jewar Logistics Hub
        var meerutTehsil = context.Tehsils.FirstOrDefault(t => t.DistrictId == meerutDist.Id);
        var dabathwaVillage = context.Villages.FirstOrDefault(v => v.Name == "Dabathwa");

        var parcelUpGbn1 = new LandParcel
        {
            Id = Guid.NewGuid(),
            ProjectId = projectUp2.Id,
            StateId = upState.Id,
            DistrictId = gbnDist.Id,
            TehsilId = meerutTehsil?.Id ?? Guid.NewGuid(),
            VillageId = dabathwaVillage?.Id ?? Guid.NewGuid(),
            SurveyNumber = "401/2A",
            ParcelNumber = "PARCEL-UP-GBN-001",
            AreaHectares = 15.50m,
            LandType = "Agricultural",
            AcquisitionStatus = LandAcquisitionStatus.Surveyed,
            Latitude = 28.3245,
            Longitude = 77.5512,
            GeoJsonGeometry = "{\"type\":\"Polygon\",\"coordinates\":[[[77.545,28.320],[77.555,28.320],[77.555,28.328],[77.545,28.328],[77.545,28.320]]]}"
        };
        var parcelUpGbn2 = new LandParcel
        {
            Id = Guid.NewGuid(),
            ProjectId = projectUp2.Id,
            StateId = upState.Id,
            DistrictId = gbnDist.Id,
            TehsilId = meerutTehsil?.Id ?? Guid.NewGuid(),
            VillageId = dabathwaVillage?.Id ?? Guid.NewGuid(),
            SurveyNumber = "405/3C",
            ParcelNumber = "PARCEL-UP-GBN-002",
            AreaHectares = 22.00m,
            LandType = "Commercial",
            AcquisitionStatus = LandAcquisitionStatus.NotifiedSec4,
            Latitude = 28.3310,
            Longitude = 77.5600,
            GeoJsonGeometry = "{\"type\":\"Polygon\",\"coordinates\":[[[77.555,28.325],[77.565,28.325],[77.565,28.335],[77.555,28.335],[77.555,28.325]]]}"
        };
        context.LandParcels.AddRange(parcelUpGbn1, parcelUpGbn2);

        context.ParcelOwners.Add(new ParcelOwner { Id = Guid.NewGuid(), ParcelId = parcelUpGbn1.Id, OwnerName = "Virendra Singh Bhati", OwnershipPercentage = 100m, IsPrimaryOwner = true, ContactPhone = "+91 9811234567" });
        context.ParcelOwners.Add(new ParcelOwner { Id = Guid.NewGuid(), ParcelId = parcelUpGbn2.Id, OwnerName = "Surendra Kumar Sharma", OwnershipPercentage = 100m, IsPrimaryOwner = true, ContactPhone = "+91 9811234568" });

        var compGbn = new CompensationAssessment
        {
            Id = Guid.NewGuid(),
            ProjectId = projectUp2.Id,
            ParcelId = parcelUpGbn1.Id,
            AssessedAmount = 24000000m,
            SolatiumAmount = 24000000m,
            InterestAmount = 4800000m,
            TotalAmount = 52800000m,
            Status = CompensationStatus.Assessed,
            AssessedById = distUser.Id,
            AssessedAt = DateTime.UtcNow.AddDays(-15)
        };
        context.CompensationAssessments.Add(compGbn);

        await context.SaveChangesAsync();
    }

    public static async Task SeedAdditionalAgencyDataAsync(ApplicationDbContext context)
    {
        var agencyRole = context.Roles.FirstOrDefault(r => r.Name == "ProjectAgency");
        var railOrg = context.Organizations.FirstOrDefault(o => o.Code == "DFCCIL");
        var nhaiOrg = context.Organizations.FirstOrDefault(o => o.Code == "NHAI");
        if (agencyRole == null || railOrg == null || nhaiOrg == null) return;

        // 1. Ensure secondary agency user for cross-tenant isolation testing (DFCCIL)
        if (!context.Users.Any(u => u.Username == "dfccil.agency"))
        {
            var dfccilUser = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = railOrg.Id,
                Username = "dfccil.agency",
                PasswordHash = "Agency@123",
                Email = "project@dfccil.gov.in",
                FirstName = "Alok",
                LastName = "Verma",
                Phone = "+91 9876543219"
            };
            context.Users.Add(dfccilUser);
            context.UserRoles.Add(new UserRole { UserId = dfccilUser.Id, RoleId = agencyRole.Id });
        }

        // 2. Ensure nhai.agency alias user exists
        if (!context.Users.Any(u => u.Username == "nhai.agency"))
        {
            var nhaiAgencyUser = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = nhaiOrg.Id,
                Username = "nhai.agency",
                PasswordHash = "Agency@123",
                Email = "agency.admin@nhai.gov.in",
                FirstName = "Rajendra",
                LastName = "Prasad",
                Phone = "+91 9876543218"
            };
            context.Users.Add(nhaiAgencyUser);
            context.UserRoles.Add(new UserRole { UserId = nhaiAgencyUser.Id, RoleId = agencyRole.Id });
        }

        var upState = context.States.FirstOrDefault(s => s.Code == "UP");
        var meerutDist = context.Districts.FirstOrDefault(d => d.Code == "UP-MRT");
        var primaryAgencyUser = context.Users.FirstOrDefault(u => u.Username == "agency.user") 
                             ?? context.Users.FirstOrDefault(u => u.Username == "nhai.agency");

        if (upState != null && meerutDist != null && primaryAgencyUser != null)
        {
            // 3. Ensure a Draft Proposal exists for NHAI
            if (!context.Proposals.Any(p => p.Status == ProposalStatus.Draft && p.Project.OrganizationId == nhaiOrg.Id))
            {
                var draftProject = new Project
                {
                    Id = Guid.NewGuid(),
                    ProjectCode = "NHAI-UP-MRT-DRAFT",
                    Name = "NH-58 Modinagar-Meerut Expressway Connector Spur",
                    Description = "Proposed 4-lane feeder link to reduce urban transit congestion connecting Delhi-Meerut Expressway to NH-58 bypass.",
                    ProjectType = ProjectType.NationalHighway,
                    OrganizationId = nhaiOrg.Id,
                    StateId = upState.Id,
                    DistrictId = meerutDist.Id,
                    EstimatedCost = 210000000.00m,
                    RequiredAreaHectares = 28.50m,
                    Status = ProjectStatus.Planning,
                    StartDate = DateTime.UtcNow.AddMonths(1),
                    TargetCompletionDate = DateTime.UtcNow.AddMonths(24)
                };
                context.Projects.Add(draftProject);

                var draftProposal = new Proposal
                {
                    Id = Guid.NewGuid(),
                    ProposalNumber = "PROP-2026-NHAI-DRAFT01",
                    ProjectId = draftProject.Id,
                    SubmittedById = primaryAgencyUser.Id,
                    Status = ProposalStatus.Draft,
                    LandAreaProposed = 28.50m,
                    AffectedFamilyCount = 12,
                    EstimatedCompensation = 42000000.00m,
                    CurrentStage = "Draft Preparation - Land Requirement Specification"
                };
                context.Proposals.Add(draftProposal);
            }

            // 4. Ensure realistic documents attached to all NHAI projects
            var nhaiProjects = context.Projects.Where(p => p.OrganizationId == nhaiOrg.Id).ToList();
            foreach (var proj in nhaiProjects)
            {
                if (!context.Documents.Any(d => d.EntityId == proj.Id))
                {
                    var doc1 = new Document
                    {
                        Id = Guid.NewGuid(),
                        EntityType = "Project",
                        EntityId = proj.Id,
                        DocumentType = DocumentType.ProjectReport,
                        FileName = $"Detailed_Project_Report_{proj.ProjectCode}.pdf",
                        StoragePath = $"/documents/projects/{proj.ProjectCode}/DPR_Final.pdf",
                        ContentType = "application/pdf",
                        FileSize = 8450200,
                        CurrentVersion = 1,
                        UploadedById = primaryAgencyUser.Id
                    };
                    var doc2 = new Document
                    {
                        Id = Guid.NewGuid(),
                        EntityType = "Project",
                        EntityId = proj.Id,
                        DocumentType = DocumentType.CadastralMap,
                        FileName = $"Khasra_Cadastral_Demarcation_Map_{proj.ProjectCode}.pdf",
                        StoragePath = $"/documents/projects/{proj.ProjectCode}/Cadastral_Map.pdf",
                        ContentType = "application/pdf",
                        FileSize = 14200500,
                        CurrentVersion = 2,
                        UploadedById = primaryAgencyUser.Id
                    };
                    var doc3 = new Document
                    {
                        Id = Guid.NewGuid(),
                        EntityType = "Project",
                        EntityId = proj.Id,
                        DocumentType = DocumentType.Section4Notification,
                        FileName = $"Gazette_Notification_Section_11_{proj.ProjectCode}.pdf",
                        StoragePath = $"/documents/projects/{proj.ProjectCode}/Gazette_Sec11.pdf",
                        ContentType = "application/pdf",
                        FileSize = 2450100,
                        CurrentVersion = 1,
                        UploadedById = primaryAgencyUser.Id
                    };
                    var doc4 = new Document
                    {
                        Id = Guid.NewGuid(),
                        EntityType = "Project",
                        EntityId = proj.Id,
                        DocumentType = DocumentType.RRReceipt,
                        FileName = $"Rehabilitation_Resettlement_Plan_{proj.ProjectCode}.pdf",
                        StoragePath = $"/documents/projects/{proj.ProjectCode}/RR_Plan.pdf",
                        ContentType = "application/pdf",
                        FileSize = 5120300,
                        CurrentVersion = 1,
                        UploadedById = primaryAgencyUser.Id
                    };
                    context.Documents.AddRange(doc1, doc2, doc3, doc4);
                }
            }
        }

        await context.SaveChangesAsync();
    }
}

