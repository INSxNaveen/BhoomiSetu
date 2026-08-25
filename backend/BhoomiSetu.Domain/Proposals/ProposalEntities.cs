using BhoomiSetu.Domain.Common;
using BhoomiSetu.Domain.Enums;
using BhoomiSetu.Domain.Identity;
using BhoomiSetu.Domain.Projects;

namespace BhoomiSetu.Domain.Proposals;

public class Proposal : AuditableEntity
{
    public string ProposalNumber { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid SubmittedById { get; set; }
    public User SubmittedBy { get; set; } = null!;
    public DateTime? SubmittedAt { get; set; }
    public ProposalStatus Status { get; set; } = ProposalStatus.Draft;
    public decimal LandAreaProposed { get; set; }
    public int AffectedFamilyCount { get; set; }
    public decimal EstimatedCompensation { get; set; }
    public string CurrentStage { get; set; } = "Draft Preparation";
    public ICollection<ProposalReview> Reviews { get; set; } = new List<ProposalReview>();
}

public class ProposalReview : BaseEntity
{
    public Guid ProposalId { get; set; }
    public Proposal Proposal { get; set; } = null!;
    public Guid ReviewerId { get; set; }
    public User Reviewer { get; set; } = null!;
    public string ReviewerRole { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Verify, Approve, Reject, Return
    public string Comments { get; set; } = string.Empty;
    public DateTime ReviewedAt { get; set; } = DateTime.UtcNow;
}
