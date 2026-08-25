namespace BhoomiSetu.Domain.Enums;

public enum OrganizationType
{
    CentralMinistry,
    StateGovernment,
    DistrictAdministration,
    ProjectAgency,
    Other
}

public enum ProjectType
{
    NationalHighway,
    RailwayLine,
    Airport,
    IndustrialCorridor,
    UrbanInfrastructure,
    Irrigation,
    PowerAndEnergy,
    Other
}

public enum ProjectStatus
{
    Planning,
    ProposalSubmitted,
    UnderVerification,
    Approved,
    AcquisitionInProgress,
    CompensationPhase,
    PossessionPhase,
    RehabilitationPhase,
    Completed,
    OnHold
}

public enum ProposalStatus
{
    Draft,
    Submitted,
    DistrictVerification,
    ReturnedForCorrection,
    StateReview,
    Approved,
    Rejected,
    AcquisitionInitiated
}

public enum LandAcquisitionStatus
{
    Proposed,
    Surveyed,
    NotifiedSec4,
    DeclarationSec19,
    Awarded,
    CompensationPaid,
    PossessionTaken,
    Disputed
}

public enum CompensationStatus
{
    PendingAssessment,
    Assessed,
    Approved,
    DisbursementPending,
    Disbursed,
    Disputed
}

public enum PossessionStatus
{
    Pending,
    NoticeIssued,
    PartialPossession,
    PossessionTaken,
    HandedOver
}

public enum RehabilitationStatus
{
    Identified,
    Verified,
    PackageApproved,
    DisbursementPending,
    Completed
}

public enum DocumentType
{
    ProjectReport,
    CadastralMap,
    RevenueRecord,
    Section4Notification,
    Section19Declaration,
    FieldVerificationReport,
    AwardCopy,
    CompensationReceipt,
    PossessionCertificate,
    RRReceipt,
    Other
}
