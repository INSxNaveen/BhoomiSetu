using BhoomiSetu.Application.Common.Interfaces;
using BhoomiSetu.Domain.Geography;
using BhoomiSetu.Domain.Identity;
using BhoomiSetu.Domain.LandAcquisition;
using BhoomiSetu.Domain.Projects;
using BhoomiSetu.Domain.Proposals;
using Microsoft.EntityFrameworkCore;

namespace BhoomiSetu.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    public DbSet<State> States => Set<State>();
    public DbSet<District> Districts => Set<District>();
    public DbSet<Tehsil> Tehsils => Set<Tehsil>();
    public DbSet<Village> Villages => Set<Village>();

    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectMilestone> ProjectMilestones => Set<ProjectMilestone>();

    public DbSet<Proposal> Proposals => Set<Proposal>();
    public DbSet<ProposalReview> ProposalReviews => Set<ProposalReview>();

    public DbSet<LandParcel> LandParcels => Set<LandParcel>();
    public DbSet<ParcelOwner> ParcelOwners => Set<ParcelOwner>();

    public DbSet<CompensationAssessment> CompensationAssessments => Set<CompensationAssessment>();
    public DbSet<CompensationPayment> CompensationPayments => Set<CompensationPayment>();

    public DbSet<PossessionRecord> PossessionRecords => Set<PossessionRecord>();

    public DbSet<AffectedFamily> AffectedFamilies => Set<AffectedFamily>();
    public DbSet<RehabilitationCase> RehabilitationCases => Set<RehabilitationCase>();
    public DbSet<RehabilitationBenefit> RehabilitationBenefits => Set<RehabilitationBenefit>();

    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();

    public DbSet<UserNotification> UserNotifications => Set<UserNotification>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Keys & Composite Relationships
        modelBuilder.Entity<UserRole>().HasKey(ur => new { ur.UserId, ur.RoleId });
        modelBuilder.Entity<RolePermission>().HasKey(rp => new { rp.RoleId, rp.PermissionId });

        // Database Indexes for Performance & Query Optimization
        modelBuilder.Entity<Project>()
            .HasIndex(p => new { p.StateId, p.DistrictId, p.Status, p.ProjectType });

        modelBuilder.Entity<LandParcel>()
            .HasIndex(lp => new { lp.ProjectId, lp.StateId, lp.DistrictId, lp.AcquisitionStatus });

        modelBuilder.Entity<CompensationAssessment>()
            .HasIndex(ca => new { ca.ProjectId, ca.ParcelId, ca.Status });

        modelBuilder.Entity<CompensationPayment>()
            .HasIndex(cp => new { cp.AssessmentId, cp.Status });

        modelBuilder.Entity<PossessionRecord>()
            .HasIndex(pr => new { pr.ProjectId, pr.ParcelId, pr.Status });

        modelBuilder.Entity<AffectedFamily>()
            .HasIndex(af => new { af.ProjectId, af.ParcelId });

        modelBuilder.Entity<RehabilitationCase>()
            .HasIndex(rc => new { rc.AffectedFamilyId, rc.Status });

        modelBuilder.Entity<AuditLog>()
            .HasIndex(al => new { al.UserId, al.EntityType, al.CreatedAt });

        // Decimal Precision configuration
        foreach (var property in modelBuilder.Model.GetEntityTypes()
                     .SelectMany(t => t.GetProperties())
                     .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetPrecision(18);
            property.SetScale(4);
        }
    }
}
