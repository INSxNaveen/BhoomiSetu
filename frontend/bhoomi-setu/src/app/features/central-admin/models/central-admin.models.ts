export interface NationalKpiSummary {
  totalProjects: number;
  projectsThisMonth: number;
  totalLandProposedHectares: number;
  totalLandAcquiredHectares: number;
  landAcquisitionPercentage: number;
  totalCompensationAssessed: number;
  totalCompensationDisbursed: number;
  compensationDisbursementPercentage: number;
  totalAffectedFamilies: number;
  totalDisplacedFamilies: number;
  rrProgressPercentage: number;
  rrFamiliesCovered: number;
  activeStatesCount: number;
}

export interface PipelineStage {
  stageKey: string;
  stageName: string;
  count: number;
  percentage: number;
  description: string;
}

export interface StateProgressItem {
  stateId: string;
  stateName: string;
  stateCode: string;
  projectCount: number;
  landProposedHectares: number;
  landAcquiredHectares: number;
  acquisitionPercentage: number;
  compensationDisbursed: number;
  rrPercentage: number;
  status: string;
}

export interface DelayedProjectItem {
  projectId: string;
  projectCode: string;
  projectName: string;
  stateName: string;
  districtName: string;
  delayDays: number;
  currentStage: string;
  plannedCompletionDate: string;
  status: string;
}

export interface NationalGisProject {
  id: string;
  projectCode: string;
  name: string;
  projectType: number | string;
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  estimatedCost: number;
  requiredAreaHectares: number;
  acquiredAreaHectares: number;
  progressPercentage: number;
  status: number | string;
  latitude: number;
  longitude: number;
  compensationPaid: number;
  possessionStatus: string;
  affectedFamilyCount: number;
}

export interface NationalDashboardData {
  kpis: NationalKpiSummary;
  pipeline: PipelineStage[];
  stateProgress: StateProgressItem[];
  delayedProjects: DelayedProjectItem[];
  mapProjects: NationalGisProject[];
  lastUpdated: string;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  landAcquiredHectares: number;
  compensationPaid: number;
  projectsApproved: number;
}

export interface StateComparison {
  stateName: string;
  stateCode: string;
  acquisitionPercentage: number;
  compensationPercentage: number;
  rrPercentage: number;
  timelineCompliancePercentage: number;
  performanceTier: string;
}

export interface TimelinePerformance {
  onScheduleCount: number;
  delayedUnder30Count: number;
  delayedOver30Count: number;
  onSchedulePercentage: number;
}

export interface CompensationAnalytics {
  totalAssessed: number;
  totalApproved: number;
  totalDisbursed: number;
  pendingDisbursement: number;
  disbursementRate: number;
}

export interface RehabilitationAnalytics {
  totalAffectedFamilies: number;
  displacedFamilies: number;
  rrEligibleCount: number;
  rrAssistanceProvidedCount: number;
  rrCompletedCount: number;
  totalProvidedAmount: number;
  completionPercentage: number;
}

export interface NationalReportAnalytics {
  summary: NationalKpiSummary;
  monthlyTrends: MonthlyTrend[];
  stateComparisons: StateComparison[];
  timelinePerformance: TimelinePerformance;
  compensationAnalytics: CompensationAnalytics;
  rehabilitationAnalytics: RehabilitationAnalytics;
}
