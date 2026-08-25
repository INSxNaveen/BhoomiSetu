using BhoomiSetu.Domain.Geography;
using BhoomiSetu.Domain.Identity;
using BhoomiSetu.Domain.LandAcquisition;
using BhoomiSetu.Domain.Projects;
using BhoomiSetu.Domain.Proposals;
using Microsoft.EntityFrameworkCore;

namespace BhoomiSetu.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Organization> Organizations { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<Permission> Permissions { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<RolePermission> RolePermissions { get; }

    DbSet<State> States { get; }
    DbSet<District> Districts { get; }
    DbSet<Tehsil> Tehsils { get; }
    DbSet<Village> Villages { get; }

    DbSet<Project> Projects { get; }
    DbSet<ProjectMilestone> ProjectMilestones { get; }

    DbSet<Proposal> Proposals { get; }
    DbSet<ProposalReview> ProposalReviews { get; }

    DbSet<LandParcel> LandParcels { get; }
    DbSet<ParcelOwner> ParcelOwners { get; }

    DbSet<CompensationAssessment> CompensationAssessments { get; }
    DbSet<CompensationPayment> CompensationPayments { get; }

    DbSet<PossessionRecord> PossessionRecords { get; }

    DbSet<AffectedFamily> AffectedFamilies { get; }
    DbSet<RehabilitationCase> RehabilitationCases { get; }
    DbSet<RehabilitationBenefit> RehabilitationBenefits { get; }

    DbSet<Document> Documents { get; }
    DbSet<DocumentVersion> DocumentVersions { get; }

    DbSet<UserNotification> UserNotifications { get; }
    DbSet<AuditLog> AuditLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
