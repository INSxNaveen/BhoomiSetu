using BhoomiSetu.Domain.Common;
using BhoomiSetu.Domain.Enums;
using BhoomiSetu.Domain.Geography;
using BhoomiSetu.Domain.Identity;

namespace BhoomiSetu.Domain.Projects;

public class Project : AuditableEntity
{
    public string ProjectCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ProjectType ProjectType { get; set; }
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;
    public Guid StateId { get; set; }
    public State State { get; set; } = null!;
    public Guid DistrictId { get; set; }
    public District District { get; set; } = null!;
    public decimal EstimatedCost { get; set; }
    public decimal RequiredAreaHectares { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? TargetCompletionDate { get; set; }
    public ProjectStatus Status { get; set; } = ProjectStatus.Planning;
    public ICollection<ProjectMilestone> Milestones { get; set; } = new List<ProjectMilestone>();
}

public class ProjectMilestone : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime PlannedDate { get; set; }
    public DateTime? ActualDate { get; set; }
    public string Status { get; set; } = "Pending";
    public int SequenceNumber { get; set; }
}
