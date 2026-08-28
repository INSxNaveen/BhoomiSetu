using BhoomiSetu.Domain.Enums;

namespace BhoomiSetu.Application.DTOs;

public record LoginRequestDto(string Username, string Password);

public record RegisterRequestDto(
    string Username,
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Phone,
    string Role,
    Guid? OrganizationId,
    Guid? StateId,
    Guid? DistrictId
);

public record LoginResponseDto(
    string AccessToken,
    string TokenType,
    int ExpiresInSeconds,
    UserInfoDto User
);

public record RegistrationResultDto(
    Guid UserId,
    string Username,
    string Email,
    string Role,
    string Message
);

public record UserInfoDto(
    Guid Id,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    Guid OrganizationId,
    string OrganizationName,
    Guid? StateId,
    string? StateName,
    Guid? DistrictId,
    string? DistrictName,
    List<string> Permissions
);

public record DashboardSummaryDto(
    int TotalProjects,
    int PendingProposals,
    int ApprovedProjects,
    decimal TotalLandProposedHectares,
    decimal TotalLandAcquiredHectares,
    decimal TotalCompensationAssessedInr,
    decimal TotalCompensationDisbursedInr,
    int TotalAffectedFamilies,
    int CompletedPossessions,
    int CompletedRehabilitationCases
);

public record StateProgressDto(
    Guid StateId,
    string StateName,
    int ActiveProjects,
    decimal TotalAreaHectares,
    decimal AcquiredAreaHectares,
    decimal PercentageComplete
);

public record ProjectDto(
    Guid Id,
    string ProjectCode,
    string Name,
    string Description,
    ProjectType ProjectType,
    Guid OrganizationId,
    string OrganizationName,
    Guid StateId,
    string StateName,
    Guid DistrictId,
    string DistrictName,
    decimal EstimatedCost,
    decimal RequiredAreaHectares,
    ProjectStatus Status,
    DateTime? StartDate,
    DateTime? TargetCompletionDate,
    DateTime CreatedAt
);

public record CreateProjectDto(
    string Name,
    string Description,
    ProjectType ProjectType,
    Guid StateId,
    Guid DistrictId,
    decimal EstimatedCost,
    decimal RequiredAreaHectares
);

public record ProposalDto(
    Guid Id,
    string ProposalNumber,
    Guid ProjectId,
    string ProjectName,
    string ProjectCode,
    Guid SubmittedById,
    string SubmittedByName,
    DateTime? SubmittedAt,
    ProposalStatus Status,
    decimal LandAreaProposed,
    int AffectedFamilyCount,
    decimal EstimatedCompensation,
    string CurrentStage,
    Guid StateId,
    string StateName,
    Guid DistrictId,
    string DistrictName,
    DateTime CreatedAt,
    List<ProposalReviewDto> Reviews
);

public record ProposalReviewDto(
    Guid Id,
    string ReviewerName,
    string ReviewerRole,
    string Action,
    string Comments,
    DateTime ReviewedAt
);

public record CreateProposalDto(
    Guid ProjectId,
    decimal LandAreaProposed,
    int AffectedFamilyCount,
    decimal EstimatedCompensation
);

public record ProposalActionDto(
    string Action, // Verify, Approve, Reject, Return
    string Comments
);

public record GeoJsonFeatureCollectionDto(
    string Type,
    List<GeoJsonFeatureDto> Features
);

public record GeoJsonFeatureDto(
    string Type,
    GeoJsonGeometryDto Geometry,
    Dictionary<string, object> Properties
);

public record GeoJsonGeometryDto(
    string Type,
    object Coordinates
);

public record LandParcelDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    Guid StateId,
    string StateName,
    Guid DistrictId,
    string DistrictName,
    Guid TehsilId,
    string TehsilName,
    Guid VillageId,
    string VillageName,
    string SurveyNumber,
    string ParcelNumber,
    decimal AreaHectares,
    string LandType,
    LandAcquisitionStatus AcquisitionStatus,
    string GeoJsonGeometry,
    double Latitude,
    double Longitude,
    List<ParcelOwnerDto> Owners
);

public record ParcelOwnerDto(
    Guid Id,
    string OwnerName,
    decimal OwnershipPercentage,
    bool IsPrimaryOwner,
    string ContactPhone
);

public record CompensationSummaryDto(
    Guid ProjectId,
    string ProjectName,
    decimal TotalAssessedAmount,
    decimal TotalSolatiumAmount,
    decimal TotalInterestAmount,
    decimal GrandTotalAmount,
    decimal DisbursedAmount,
    decimal PendingAmount,
    int TotalAssessments,
    int DisbursedCount
);

public record CompensationAssessmentDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    Guid ParcelId,
    string SurveyNumber,
    decimal AssessedAmount,
    decimal SolatiumAmount,
    decimal InterestAmount,
    decimal TotalAmount,
    CompensationStatus Status,
    string AssessedByName,
    DateTime AssessedAt,
    List<CompensationPaymentDto> Payments
);

public record RecordPaymentDto(
    Guid AssessmentId,
    string PaymentReference,
    decimal Amount,
    string PaymentMethod,
    string Remarks
);

public record CompensationPaymentDto(
    Guid Id,
    string PaymentReference,
    decimal Amount,
    DateTime? PaymentDate,
    string PaymentMethod,
    string Status,
    string Remarks
);

public record PossessionRecordDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    Guid ParcelId,
    string SurveyNumber,
    decimal AreaHectares,
    DateTime? PossessionDate,
    PossessionStatus Status,
    string HandedOverByName,
    string VerifiedByName,
    string Remarks
);

public record RecordPossessionDto(
    Guid ParcelId,
    PossessionStatus Status,
    string Remarks
);

public record AffectedFamilyDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    Guid? ParcelId,
    string? SurveyNumber,
    string FamilyReference,
    string HeadOfFamilyName,
    int FamilySize,
    bool IsDisplaced,
    Guid VillageId,
    string VillageName,
    RehabilitationCaseDto? RehabilitationCase
);

public record RehabilitationCaseDto(
    Guid Id,
    RehabilitationStatus Status,
    string RehabilitationSite,
    decimal EligibleAmount,
    decimal ProvidedAmount,
    DateTime? CompletionDate,
    string Remarks,
    List<RehabilitationBenefitDto> Benefits
);

public record RehabilitationBenefitDto(
    Guid Id,
    string BenefitType,
    decimal Amount,
    DateTime? ProvidedDate,
    string Status
);

public record DocumentDto(
    Guid Id,
    string EntityType,
    Guid EntityId,
    DocumentType DocumentType,
    string FileName,
    string StoragePath,
    string ContentType,
    long FileSize,
    int CurrentVersion,
    string UploadedByName,
    DateTime CreatedAt
);

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string Username,
    string Action,
    string EntityType,
    Guid? EntityId,
    string OldValuesJson,
    string NewValuesJson,
    string IpAddress,
    DateTime CreatedAt
);

// --- Admin Module DTOs ---

public record AdminDashboardDto(
    int TotalUsers,
    int ActiveOrganizations,
    int TotalProjects,
    int ActiveStates,
    string ApiStatus,
    string SystemStatus
);

public record ServiceHealthItemDto(
    string ServiceName,
    string Status, // Operational, Degraded, Unavailable
    string Uptime,
    string Details
);

public record UserDistributionDto(
    string RoleName,
    int UserCount,
    double Percentage
);

public record AdminUserDto(
    Guid Id,
    string Username,
    string Email,
    string FirstName,
    string LastName,
    string Phone,
    Guid OrganizationId,
    string OrganizationName,
    Guid? StateId,
    string? StateName,
    Guid? DistrictId,
    string? DistrictName,
    string Role,
    bool IsActive,
    DateTime? LastLoginAt,
    DateTime CreatedAt
);

public record CreateAdminUserRequestDto(
    string Username,
    string Email,
    string FirstName,
    string LastName,
    string Phone,
    string Role,
    Guid OrganizationId,
    Guid? StateId,
    Guid? DistrictId,
    bool IsActive = true
);

public record UpdateAdminUserRequestDto(
    string FirstName,
    string LastName,
    string Email,
    string Phone,
    string Role,
    Guid OrganizationId,
    Guid? StateId,
    Guid? DistrictId,
    bool IsActive
);

public record AdminOrganizationDto(
    Guid Id,
    string Name,
    string Code,
    OrganizationType OrganizationType,
    Guid? StateId,
    string? StateName,
    Guid? DistrictId,
    string? DistrictName,
    string ContactEmail,
    bool IsActive,
    int UserCount,
    int ProjectCount,
    DateTime CreatedAt
);

public record CreateAdminOrganizationRequestDto(
    string Name,
    string Code,
    OrganizationType OrganizationType,
    Guid? StateId,
    Guid? DistrictId,
    string ContactEmail,
    bool IsActive = true
);

public record UpdateAdminOrganizationRequestDto(
    string Name,
    string Code,
    OrganizationType OrganizationType,
    Guid? StateId,
    Guid? DistrictId,
    string ContactEmail,
    bool IsActive
);

public record AdminRoleDto(
    Guid Id,
    string Name,
    string Description,
    int UserCount,
    int PermissionCount
);

public record PermissionMatrixItemDto(
    Guid PermissionId,
    string Code,
    string Name,
    string Module,
    string Action,
    bool IsGranted
);

public record RolePermissionsMatrixDto(
    Guid RoleId,
    string RoleName,
    string RoleDescription,
    List<PermissionMatrixItemDto> Permissions
);

public record UpdateRolePermissionsRequestDto(
    List<Guid> GrantedPermissionIds
);

// --- Central Admin Module DTOs ---

public record NationalKpiSummaryDto(
    int TotalProjects,
    int ProjectsThisMonth,
    decimal TotalLandProposedHectares,
    decimal TotalLandAcquiredHectares,
    double LandAcquisitionPercentage,
    decimal TotalCompensationAssessed,
    decimal TotalCompensationDisbursed,
    double CompensationDisbursementPercentage,
    int TotalAffectedFamilies,
    int TotalDisplacedFamilies,
    double RrProgressPercentage,
    int RrFamiliesCovered,
    int ActiveStatesCount
);

public record PipelineStageDto(
    string StageKey,
    string StageName,
    int Count,
    double Percentage,
    string Description
);

public record StateProgressItemDto(
    Guid StateId,
    string StateName,
    string StateCode,
    int ProjectCount,
    decimal LandProposedHectares,
    decimal LandAcquiredHectares,
    double AcquisitionPercentage,
    decimal CompensationDisbursed,
    double RrPercentage,
    string Status
);

public record DelayedProjectItemDto(
    Guid ProjectId,
    string ProjectCode,
    string ProjectName,
    string StateName,
    string DistrictName,
    int DelayDays,
    string CurrentStage,
    DateTime PlannedCompletionDate,
    string Status
);

public record NationalGisProjectDto(
    Guid Id,
    string ProjectCode,
    string Name,
    ProjectType ProjectType,
    Guid StateId,
    string StateName,
    Guid DistrictId,
    string DistrictName,
    decimal EstimatedCost,
    decimal RequiredAreaHectares,
    decimal AcquiredAreaHectares,
    double ProgressPercentage,
    ProjectStatus Status,
    double Latitude,
    double Longitude,
    decimal CompensationPaid,
    string PossessionStatus,
    int AffectedFamilyCount
);

public record NationalDashboardDto(
    NationalKpiSummaryDto Kpis,
    List<PipelineStageDto> Pipeline,
    List<StateProgressItemDto> StateProgress,
    List<DelayedProjectItemDto> DelayedProjects,
    List<NationalGisProjectDto> MapProjects,
    DateTime LastUpdated
);

public record MonthlyTrendDto(
    string Month,
    int Year,
    decimal LandAcquiredHectares,
    decimal CompensationPaid,
    int ProjectsApproved
);

public record StateComparisonDto(
    string StateName,
    string StateCode,
    double AcquisitionPercentage,
    double CompensationPercentage,
    double RrPercentage,
    double TimelineCompliancePercentage,
    string PerformanceTier
);

public record TimelinePerformanceDto(
    int OnScheduleCount,
    int DelayedUnder30Count,
    int DelayedOver30Count,
    double OnSchedulePercentage
);

public record CompensationAnalyticsDto(
    decimal TotalAssessed,
    decimal TotalApproved,
    decimal TotalDisbursed,
    decimal PendingDisbursement,
    double DisbursementRate
);

public record RehabilitationAnalyticsDto(
    int TotalAffectedFamilies,
    int DisplacedFamilies,
    int RrEligibleCount,
    int RrAssistanceProvidedCount,
    int RrCompletedCount,
    decimal TotalProvidedAmount,
    double CompletionPercentage
);

public record NationalReportAnalyticsDto(
    NationalKpiSummaryDto Summary,
    List<MonthlyTrendDto> MonthlyTrends,
    List<StateComparisonDto> StateComparisons,
    TimelinePerformanceDto TimelinePerformance,
    CompensationAnalyticsDto CompensationAnalytics,
    RehabilitationAnalyticsDto RehabilitationAnalytics
);

#region State Admin DTOs
public record StateKpisDto(
    int TotalProjects,
    int ProjectsThisMonth,
    decimal TotalLandProposedHectares,
    decimal TotalLandAcquiredHectares,
    double LandAcquisitionPercentage,
    decimal TotalCompensationAssessed,
    decimal TotalCompensationDisbursed,
    double CompensationDisbursementPercentage,
    int TotalAffectedFamilies,
    int TotalDisplacedFamilies,
    double RrProgressPercentage,
    int RrFamiliesCovered
);

public record StateDistrictProgressDto(
    Guid DistrictId,
    string DistrictName,
    string DistrictCode,
    int TotalProjects,
    decimal LandProposedHectares,
    decimal LandAcquiredHectares,
    double AcquisitionPercentage,
    decimal CompensationDisbursed,
    int RrCasesCovered,
    string Status
);

public record StateProposalSummaryDto(
    int PendingReview,
    int Approved,
    int Returned,
    int Rejected
);

public record StateDelayedProjectDto(
    Guid ProjectId,
    string ProjectName,
    string DistrictName,
    string ProjectType,
    string DelayedMilestone,
    int DaysDelayed,
    string Status
);

public record StateDashboardDto(
    Guid StateId,
    string StateName,
    DateTime LastUpdated,
    StateKpisDto Kpis,
    List<PipelineStageDto> Pipeline,
    List<StateDistrictProgressDto> DistrictProgress,
    StateProposalSummaryDto ProposalSummary,
    List<StateDelayedProjectDto> DelayedProjects
);

public record StateProposalListDto(
    Guid Id,
    string ProposalNumber,
    Guid ProjectId,
    string ProjectName,
    string ProjectCode,
    string DistrictName,
    string StateName,
    string ProjectType,
    decimal LandAreaProposed,
    int AffectedFamilyCount,
    decimal EstimatedCompensation,
    string Status,
    string CurrentStage,
    DateTime? SubmittedAt,
    string Priority
);

public record StateProposalLandDetailsDto(
    decimal TotalRequiredHectares,
    decimal GovernmentLandHectares,
    decimal PrivateLandHectares,
    int AffectedParcelsCount,
    int OwnersIdentifiedCount,
    int VerificationPendingCount,
    double Latitude,
    double Longitude
);

public record StateProposalDocumentDto(
    Guid Id,
    string FileName,
    string DocumentType,
    string FileSizeFormatted,
    DateTime UploadedAt,
    string ContentType,
    string DownloadUrl
);

public record StateProposalFamiliesDto(
    int TotalAffected,
    int Displaced,
    int EligibleForRr,
    int RrCompleted,
    decimal CompensationAssessed,
    decimal CompensationDisbursed
);

public record StateProposalTimelineItemDto(
    string Stage,
    string Action,
    string ActorName,
    string ActorRole,
    DateTime ReviewedAt,
    string Comments,
    string StatusBadge
);

public record StateProposalDetailDto(
    Guid Id,
    string ProposalNumber,
    Guid ProjectId,
    string ProjectName,
    string ProjectCode,
    string ProjectAgency,
    string DistrictName,
    string StateName,
    string ProjectType,
    decimal EstimatedCost,
    decimal LandAreaProposed,
    int AffectedFamilyCount,
    decimal EstimatedCompensation,
    string Status,
    string CurrentStage,
    DateTime? SubmittedAt,
    string SubmittedBy,
    StateProposalLandDetailsDto LandDetails,
    List<StateProposalDocumentDto> Documents,
    StateProposalFamiliesDto AffectedFamilies,
    List<StateProposalTimelineItemDto> Timeline
);

public record StateProposalWorkflowRequestDto(
    string? Reason,
    string? Comments
);

public record StateGisProjectDto(
    Guid Id,
    string ProjectCode,
    string Name,
    string DistrictName,
    string ProjectType,
    string Status,
    double Latitude,
    double Longitude,
    decimal RequiredAreaHectares,
    decimal AcquiredAreaHectares,
    double ProgressPercentage,
    decimal TotalCompensation,
    decimal DisbursedCompensation,
    int AffectedFamilies
);

public record StateGisParcelDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    string DistrictName,
    string SurveyNumber,
    string ParcelNumber,
    string VillageName,
    decimal AreaHectares,
    string LandType,
    string AcquisitionStatus,
    string GeoJsonGeometry,
    double Latitude,
    double Longitude,
    List<string> OwnerNames,
    decimal CompensationAmount,
    string CompensationStatus,
    string PossessionStatus
);

public record StateAcquisitionKpisDto(
    decimal LandProposedHectares,
    decimal LandNotifiedHectares,
    decimal LandAcquiredHectares,
    decimal CompensationAssessed,
    decimal CompensationPaid,
    decimal CompensationPending,
    int PossessionCompletedCount,
    int AffectedFamilies,
    int DisplacedFamilies,
    int RrEligible,
    int RrCompleted
);

public record StateCompensationAnalyticsDto(
    decimal TotalAssessed,
    decimal TotalApproved,
    decimal TotalPaid,
    decimal TotalPending,
    decimal TotalDisputed,
    List<MonthlyTrendDto> MonthlyTrends
);

public record StatePossessionAnalyticsDto(
    int PendingCount,
    int ScheduledCount,
    int PossessionTakenCount,
    int HandedOverCount,
    decimal PossessionCompletedHectares,
    double CompletionPercentage
);

public record StateRehabilitationAnalyticsDto(
    int TotalAffectedFamilies,
    int DisplacedFamilies,
    int EligibleForRr,
    int HousingPlotsAllotted,
    int SubsistenceGrantsDisbursed,
    int RrCompletedCases,
    decimal TotalProvidedAmount,
    double CompletionPercentage
);

public record StateAcquisitionAnalyticsDto(
    string StateName,
    StateAcquisitionKpisDto Kpis,
    StateCompensationAnalyticsDto Compensation,
    StatePossessionAnalyticsDto Possession,
    StateRehabilitationAnalyticsDto Rehabilitation
);
#endregion

#region District Admin DTOs
public record DistrictKpisDto(
    int ActiveProjects,
    int TotalLandParcels,
    decimal TotalLandRequiredHectares,
    decimal TotalLandAcquiredHectares,
    double LandAcquisitionPercentage,
    int PendingVerificationsCount,
    decimal TotalCompensationAssessed,
    decimal TotalCompensationDisbursed,
    double CompensationDisbursementPercentage,
    int PendingPossessionsCount,
    int AffectedFamiliesCount,
    int DisplacedFamiliesCount,
    int RrCompletedCount,
    double RrProgressPercentage
);

public record DistrictVerificationSummaryDto(
    int Pending,
    int Verified,
    int Returned
);

public record DistrictTehsilProgressDto(
    Guid TehsilId,
    string TehsilName,
    int ParcelsCount,
    decimal LandAreaHectares,
    int VerifiedCount,
    decimal CompensationDisbursed,
    string Status
);

public record DistrictDelayedMilestoneDto(
    Guid ProjectId,
    string ProjectName,
    string MilestoneName,
    int DaysDelayed,
    string Status
);

public record DistrictActivityDto(
    string Title,
    string Description,
    DateTime Timestamp,
    string Type
);

public record DistrictDashboardDto(
    Guid DistrictId,
    string DistrictName,
    string DistrictCode,
    string StateName,
    DateTime LastUpdated,
    DistrictKpisDto Kpis,
    List<PipelineStageDto> Pipeline,
    DistrictVerificationSummaryDto VerificationSummary,
    List<DistrictTehsilProgressDto> TehsilBreakdown,
    List<DistrictDelayedMilestoneDto> DelayedMilestones,
    List<DistrictActivityDto> RecentActivity
);

public record DistrictVerificationItemDto(
    Guid Id,
    Guid ParcelId,
    string ParcelNumber,
    string SurveyNumber,
    Guid ProjectId,
    string ProjectName,
    string ProjectCode,
    string TehsilName,
    string VillageName,
    decimal AreaHectares,
    string LandType,
    List<string> OwnerNames,
    string VerificationStatus,
    DateTime SubmittedAt,
    string ProposalNumber,
    string Comments
);

public record DistrictVerificationActionDto(
    string? Comments,
    string? Reason
);

public record DistrictJointSurveyDto(
    Guid Id,
    Guid ParcelId,
    string SurveyNumber,
    string ParcelNumber,
    Guid ProjectId,
    string ProjectName,
    string TehsilName,
    string VillageName,
    DateTime ScheduledDate,
    string SurveyTeamLeader,
    string Status,
    string Remarks
);

public record DistrictCompensationItemDto(
    Guid AssessmentId,
    Guid ParcelId,
    string SurveyNumber,
    string ParcelNumber,
    string ProjectName,
    string TehsilName,
    string VillageName,
    string OwnerName,
    decimal AssessedAmount,
    decimal SolatiumAmount,
    decimal InterestAmount,
    decimal TotalAmount,
    string Status,
    DateTime AssessedAt,
    decimal DisbursedAmount,
    DateTime? PaymentDate,
    string? PaymentReference
);

public record DistrictCompensationSummaryDto(
    decimal TotalAssessed,
    decimal TotalApproved,
    decimal TotalDisbursed,
    decimal TotalPending,
    int TotalAssessments,
    int PaidAssessments,
    List<DistrictCompensationItemDto> Assessments
);

public record DistrictPossessionItemDto(
    Guid RecordId,
    Guid ParcelId,
    string SurveyNumber,
    string ParcelNumber,
    Guid ProjectId,
    string ProjectName,
    string TehsilName,
    string VillageName,
    string OwnerName,
    decimal AreaHectares,
    string PossessionStatus,
    DateTime? PossessionDate,
    string HandedOverByName,
    string VerifiedByName,
    string Remarks
);

public record DistrictPossessionSummaryDto(
    int TotalParcels,
    int PossessionTakenCount,
    int NoticeIssuedCount,
    int PendingCount,
    decimal PossessionCompletedHectares,
    double CompletionPercentage,
    List<DistrictPossessionItemDto> Records
);

public record DistrictRehabilitationItemDto(
    Guid CaseId,
    Guid FamilyId,
    string FamilyReference,
    string HeadOfFamilyName,
    string VillageName,
    string ProjectName,
    int FamilySize,
    bool IsDisplaced,
    string Status,
    string RehabilitationSite,
    decimal EligibleAmount,
    decimal ProvidedAmount,
    DateTime? CompletionDate,
    int BenefitsCount,
    string Remarks
);

public record DistrictRehabilitationSummaryDto(
    int TotalAffectedFamilies,
    int DisplacedFamilies,
    int EligibleForRr,
    int CompletedCases,
    decimal TotalEligibleAmount,
    decimal TotalProvidedAmount,
    double CompletionPercentage,
    List<DistrictRehabilitationItemDto> Cases
);

public record DistrictReportDto(
    string DistrictName,
    string StateName,
    DateTime GeneratedAt,
    DistrictKpisDto Metrics,
    List<DistrictTehsilProgressDto> TehsilProgress,
    List<MonthlyTrendDto> MonthlyTrends,
    DistrictCompensationSummaryDto CompensationSummary,
    DistrictPossessionSummaryDto PossessionSummary,
    DistrictRehabilitationSummaryDto RehabilitationSummary
);
#endregion

#region Project Agency DTOs
public record AgencyKpisDto(
    int TotalProjects,
    int DraftProposals,
    int SubmittedUnderReview,
    int ApprovedProjects,
    decimal LandRequiredHectares,
    decimal LandAcquiredHectares,
    decimal CompensationPaid,
    int DelayedProjects
);

public record AgencyAttentionItemDto(
    string Id,
    string Type,
    string Title,
    string Description,
    string Severity,
    string ActionRoute,
    Guid? EntityId
);

public record AgencyProjectSummaryDto(
    Guid ProjectId,
    string ProjectCode,
    string ProjectName,
    string ProjectType,
    string Location,
    string StateName,
    string DistrictName,
    int ProgressPercentage,
    decimal LandRequiredHectares,
    decimal LandAcquiredHectares,
    string CurrentStage,
    string Status,
    DateTime LastUpdated
);

public record AgencyAcquisitionProgressDto(
    string Stage,
    int ParcelsCount,
    decimal AreaHectares,
    double Percentage
);

public record AgencyActivityItemDto(
    Guid Id,
    string Title,
    string Description,
    string ActionBy,
    string Role,
    DateTime Timestamp,
    string EntityType,
    Guid? EntityId
);

public record AgencyDashboardDto(
    Guid OrganizationId,
    string OrganizationName,
    string OrganizationCode,
    AgencyKpisDto Kpis,
    List<AgencyAttentionItemDto> AttentionItems,
    List<AgencyProjectSummaryDto> Projects,
    List<AgencyAcquisitionProgressDto> AcquisitionProgress,
    List<AgencyActivityItemDto> RecentActivity,
    DateTime LastUpdated
);

public record AgencyProposalItemDto(
    Guid Id,
    string ProposalNumber,
    Guid ProjectId,
    string ProjectName,
    string ProjectCode,
    string ProjectType,
    string StateName,
    string DistrictName,
    ProposalStatus Status,
    string CurrentStage,
    decimal LandAreaProposed,
    int AffectedFamilyCount,
    decimal EstimatedCompensation,
    DateTime? SubmittedAt,
    DateTime CreatedAt,
    DateTime LastUpdated,
    string? ReturnReason
);

public record AgencyDocumentSubmissionDto(
    DocumentType DocumentType,
    string FileName,
    string StoragePath,
    long FileSize,
    string Remarks
);

public record AgencyProposalCreationRequestDto(
    Guid? ProjectId,
    bool IsNewProject,
    string? ProjectName,
    string? ProjectCode,
    ProjectType ProjectType,
    Guid StateId,
    Guid DistrictId,
    string? Description,
    decimal EstimatedCost,
    DateTime? StartDate,
    DateTime? TargetCompletionDate,
    decimal LandAreaProposed,
    string? TehsilName,
    string? VillageName,
    string? SurveyNumbers,
    string? LandCategory,
    int AffectedFamilyCount,
    int DisplacedFamilyCount,
    int RehabEligibleCount,
    decimal EstimatedCompensation,
    bool IsDraft,
    List<AgencyDocumentSubmissionDto>? Documents
);

public record AgencyDocumentItemDto(
    Guid Id,
    string DocumentType,
    string FileName,
    int Version,
    string Status,
    DateTime UploadedAt,
    string UploadedBy
);

public record AgencyWorkspaceCompensationDto(
    decimal AssessedAmount,
    decimal ApprovedAmount,
    decimal DisbursedAmount,
    decimal PendingAmount,
    double DisbursementPercentage
);

public record AgencyWorkspacePossessionDto(
    int TotalParcels,
    int PossessionTakenCount,
    int PendingCount,
    decimal PossessionHectares,
    double CompletionPercentage
);

public record AgencyWorkspaceRehabilitationDto(
    int TotalAffectedFamilies,
    int DisplacedFamilies,
    int EligibleCases,
    int CompletedCases,
    decimal TotalGrantsDisbursed,
    double CompletionPercentage
);

public record AgencyMilestoneItemDto(
    Guid Id,
    string Name,
    string Description,
    DateTime PlannedDate,
    DateTime? ActualDate,
    string Status,
    int SequenceNumber,
    bool IsDelayed
);

public record AgencyProjectWorkspaceDto(
    Guid ProjectId,
    string ProjectCode,
    string ProjectName,
    string Description,
    string ProjectType,
    string OrganizationName,
    string StateName,
    string DistrictName,
    decimal EstimatedCost,
    decimal RequiredAreaHectares,
    decimal AcquiredAreaHectares,
    int OverallProgress,
    string Status,
    string CurrentStage,
    DateTime? StartDate,
    DateTime? TargetCompletionDate,
    List<LandParcelDto> LandParcels,
    List<AgencyDocumentItemDto> Documents,
    AgencyWorkspaceCompensationDto Compensation,
    AgencyWorkspacePossessionDto Possession,
    AgencyWorkspaceRehabilitationDto Rehabilitation,
    List<AgencyMilestoneItemDto> Timeline
);

public record AgencyWorkflowStageDto(
    string StageName,
    string Label,
    string Status,
    DateTime? CompletedDate,
    string? Actor,
    string? Remarks
);

public record AgencyTrackingItemDto(
    Guid ProposalId,
    string ProposalNumber,
    Guid ProjectId,
    string ProjectName,
    string CurrentStage,
    string Status,
    DateTime? SubmittedDate,
    DateTime LastUpdated,
    List<AgencyWorkflowStageDto> WorkflowStages,
    List<AgencyActivityItemDto> ActivityHistory,
    string? ReturnRemarks
);
#endregion



