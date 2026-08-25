using BhoomiSetu.Domain.Common;
using BhoomiSetu.Domain.Enums;
using BhoomiSetu.Domain.Geography;
using BhoomiSetu.Domain.Identity;
using BhoomiSetu.Domain.Projects;

namespace BhoomiSetu.Domain.LandAcquisition;

public class LandParcel : AuditableEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid StateId { get; set; }
    public State State { get; set; } = null!;
    public Guid DistrictId { get; set; }
    public District District { get; set; } = null!;
    public Guid TehsilId { get; set; }
    public Tehsil Tehsil { get; set; } = null!;
    public Guid VillageId { get; set; }
    public Village Village { get; set; } = null!;
    public string SurveyNumber { get; set; } = string.Empty;
    public string ParcelNumber { get; set; } = string.Empty;
    public decimal AreaHectares { get; set; }
    public string LandType { get; set; } = "Agricultural"; // Agricultural, Commercial, Residential, Forest
    public LandAcquisitionStatus AcquisitionStatus { get; set; } = LandAcquisitionStatus.Proposed;
    
    // GeoJSON string format representation for cross-platform compatibility
    public string GeoJsonGeometry { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    
    public ICollection<ParcelOwner> Owners { get; set; } = new List<ParcelOwner>();
}

public class ParcelOwner : BaseEntity
{
    public Guid ParcelId { get; set; }
    public LandParcel Parcel { get; set; } = null!;
    public string OwnerName { get; set; } = string.Empty;
    public decimal OwnershipPercentage { get; set; } = 100.0m;
    public bool IsPrimaryOwner { get; set; } = true;
    public string ContactPhone { get; set; } = string.Empty;
}

public class CompensationAssessment : AuditableEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid ParcelId { get; set; }
    public LandParcel Parcel { get; set; } = null!;
    public decimal AssessedAmount { get; set; }
    public decimal SolatiumAmount { get; set; }
    public decimal InterestAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public CompensationStatus Status { get; set; } = CompensationStatus.Assessed;
    public Guid AssessedById { get; set; }
    public User AssessedBy { get; set; } = null!;
    public DateTime AssessedAt { get; set; } = DateTime.UtcNow;
    public ICollection<CompensationPayment> Payments { get; set; } = new List<CompensationPayment>();
}

public class CompensationPayment : BaseEntity
{
    public Guid AssessmentId { get; set; }
    public CompensationAssessment Assessment { get; set; } = null!;
    public string PaymentReference { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = "DBT Direct Bank Transfer";
    public string Status { get; set; } = "Completed";
    public string Remarks { get; set; } = string.Empty;
}

public class PossessionRecord : AuditableEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid ParcelId { get; set; }
    public LandParcel Parcel { get; set; } = null!;
    public DateTime? PossessionDate { get; set; }
    public PossessionStatus Status { get; set; } = PossessionStatus.Pending;
    public Guid? HandedOverById { get; set; }
    public User? HandedOverBy { get; set; }
    public Guid? VerifiedById { get; set; }
    public User? VerifiedBy { get; set; }
    public string Remarks { get; set; } = string.Empty;
}

public class AffectedFamily : AuditableEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid? ParcelId { get; set; }
    public LandParcel? Parcel { get; set; }
    public string FamilyReference { get; set; } = string.Empty;
    public string HeadOfFamilyName { get; set; } = string.Empty;
    public int FamilySize { get; set; }
    public bool IsDisplaced { get; set; } = false;
    public Guid VillageId { get; set; }
    public Village Village { get; set; } = null!;
    public RehabilitationCase? RehabilitationCase { get; set; }
}

public class RehabilitationCase : AuditableEntity
{
    public Guid AffectedFamilyId { get; set; }
    public AffectedFamily AffectedFamily { get; set; } = null!;
    public RehabilitationStatus Status { get; set; } = RehabilitationStatus.Identified;
    public string RehabilitationSite { get; set; } = string.Empty;
    public decimal EligibleAmount { get; set; }
    public decimal ProvidedAmount { get; set; }
    public DateTime? CompletionDate { get; set; }
    public string Remarks { get; set; } = string.Empty;
    public ICollection<RehabilitationBenefit> Benefits { get; set; } = new List<RehabilitationBenefit>();
}

public class RehabilitationBenefit : BaseEntity
{
    public Guid RehabilitationCaseId { get; set; }
    public RehabilitationCase RehabilitationCase { get; set; } = null!;
    public string BenefitType { get; set; } = string.Empty; // Housing Grant, Employment, Resettlement Allowance
    public decimal Amount { get; set; }
    public DateTime? ProvidedDate { get; set; }
    public string Status { get; set; } = "Provided";
}

public class Document : AuditableEntity
{
    public string EntityType { get; set; } = string.Empty; // Proposal, Project, Parcel, Compensation, Possession
    public Guid EntityId { get; set; }
    public DocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
    public long FileSize { get; set; }
    public int CurrentVersion { get; set; } = 1;
    public Guid UploadedById { get; set; }
    public User UploadedBy { get; set; } = null!;
    public ICollection<DocumentVersion> Versions { get; set; } = new List<DocumentVersion>();
}

public class DocumentVersion : BaseEntity
{
    public Guid DocumentId { get; set; }
    public Document Document { get; set; } = null!;
    public int VersionNumber { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string FileHash { get; set; } = string.Empty;
    public Guid UploadedById { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string Remarks { get; set; } = string.Empty;
}

public class UserNotification : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string NotificationType { get; set; } = "Info";
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string OldValuesJson { get; set; } = string.Empty;
    public string NewValuesJson { get; set; } = string.Empty;
    public string IpAddress { get; set; } = "127.0.0.1";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
