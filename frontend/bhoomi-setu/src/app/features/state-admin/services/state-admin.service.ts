import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../../../core/config/api.config';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface StateKpis {
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
}

export interface PipelineStage {
  stageKey: string;
  stageName: string;
  count: number;
  percentage: number;
  description: string;
}

export interface StateDistrictProgress {
  districtId: string;
  districtName: string;
  districtCode: string;
  totalProjects: number;
  landProposedHectares: number;
  landAcquiredHectares: number;
  acquisitionPercentage: number;
  compensationDisbursed: number;
  rrCasesCovered: number;
  status: string;
}

export interface StateProposalSummary {
  pendingReview: number;
  approved: number;
  returned: number;
  rejected: number;
}

export interface StateDelayedProject {
  projectId: string;
  projectName: string;
  districtName: string;
  projectType: string;
  delayedMilestone: string;
  daysDelayed: number;
  status: string;
}

export interface StateDashboardData {
  stateId: string;
  stateName: string;
  lastUpdated: string;
  kpis: StateKpis;
  pipeline: PipelineStage[];
  districtProgress: StateDistrictProgress[];
  proposalSummary: StateProposalSummary;
  delayedProjects: StateDelayedProject[];
}

export interface StateProposalItem {
  id: string;
  proposalNumber: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  districtName: string;
  stateName: string;
  projectType: string;
  landAreaProposed: number;
  affectedFamilyCount: number;
  estimatedCompensation: number;
  status: string;
  currentStage: string;
  submittedAt?: string;
  priority: string;
}

export interface StateProposalLandDetails {
  totalRequiredHectares: number;
  governmentLandHectares: number;
  privateLandHectares: number;
  affectedParcelsCount: number;
  ownersIdentifiedCount: number;
  verificationPendingCount: number;
  latitude: number;
  longitude: number;
}

export interface StateProposalDocument {
  id: string;
  fileName: string;
  documentType: string;
  fileSizeFormatted: string;
  uploadedAt: string;
  contentType: string;
  downloadUrl: string;
}

export interface StateProposalFamilies {
  totalAffected: number;
  displaced: number;
  eligibleForRr: number;
  rrCompleted: number;
  compensationAssessed: number;
  compensationDisbursed: number;
}

export interface StateProposalTimelineItem {
  stage: string;
  action: string;
  actorName: string;
  actorRole: string;
  reviewedAt: string;
  comments: string;
  statusBadge: string;
}

export interface StateProposalDetail {
  id: string;
  proposalNumber: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  projectAgency: string;
  districtName: string;
  stateName: string;
  projectType: string;
  estimatedCost: number;
  landAreaProposed: number;
  affectedFamilyCount: number;
  estimatedCompensation: number;
  status: string;
  currentStage: string;
  submittedAt?: string;
  submittedBy: string;
  landDetails: StateProposalLandDetails;
  documents: StateProposalDocument[];
  affectedFamilies: StateProposalFamilies;
  timeline: StateProposalTimelineItem[];
}

export interface StateGisProject {
  id: string;
  projectCode: string;
  name: string;
  districtName: string;
  projectType: string;
  status: string;
  latitude: number;
  longitude: number;
  requiredAreaHectares: number;
  acquiredAreaHectares: number;
  progressPercentage: number;
  totalCompensation: number;
  disbursedCompensation: number;
  affectedFamilies: number;
}

export interface StateGisParcel {
  id: string;
  projectId: string;
  projectName: string;
  districtName: string;
  surveyNumber: string;
  parcelNumber: string;
  villageName: string;
  areaHectares: number;
  landType: string;
  acquisitionStatus: string;
  geoJsonGeometry: string;
  latitude: number;
  longitude: number;
  ownerNames: string[];
  compensationAmount: number;
  compensationStatus: string;
  possessionStatus: string;
}

export interface StateAcquisitionAnalytics {
  stateName: string;
  kpis: {
    landProposedHectares: number;
    landNotifiedHectares: number;
    landAcquiredHectares: number;
    compensationAssessed: number;
    compensationPaid: number;
    compensationPending: number;
    possessionCompletedCount: number;
    affectedFamilies: number;
    displacedFamilies: number;
    rrEligible: number;
    rrCompleted: number;
  };
  compensation: {
    totalAssessed: number;
    totalApproved: number;
    totalPaid: number;
    totalPending: number;
    totalDisputed: number;
    monthlyTrends: Array<{
      month: string;
      year: number;
      landAcquiredHectares: number;
      compensationPaid: number;
      projectsApproved: number;
    }>;
  };
  possession: {
    pendingCount: number;
    scheduledCount: number;
    possessionTakenCount: number;
    handedOverCount: number;
    possessionCompletedHectares: number;
    completionPercentage: number;
  };
  rehabilitation: {
    totalAffectedFamilies: number;
    displacedFamilies: number;
    eligibleForRr: number;
    housingPlotsAllotted: number;
    subsistenceGrantsDisbursed: number;
    rrCompletedCases: number;
    totalProvidedAmount: number;
    completionPercentage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StateAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${ENVIRONMENT.apiBaseUrl}/state`;

  getDashboard(districtId?: string, projectType?: string): Observable<ApiResponse<StateDashboardData>> {
    let params = new HttpParams();
    if (districtId) params = params.set('districtId', districtId);
    if (projectType) params = params.set('projectType', projectType);
    return this.http.get<ApiResponse<StateDashboardData>>(`${this.apiUrl}/dashboard`, { params });
  }

  getProposals(filter?: { districtId?: string; status?: string; projectType?: string; search?: string }): Observable<ApiResponse<StateProposalItem[]>> {
    let params = new HttpParams();
    if (filter?.districtId) params = params.set('districtId', filter.districtId);
    if (filter?.status) params = params.set('status', filter.status);
    if (filter?.projectType) params = params.set('projectType', filter.projectType);
    if (filter?.search) params = params.set('search', filter.search);
    return this.http.get<ApiResponse<StateProposalItem[]>>(`${this.apiUrl}/proposals`, { params });
  }

  getProposalDetail(id: string): Observable<ApiResponse<StateProposalDetail>> {
    return this.http.get<ApiResponse<StateProposalDetail>>(`${this.apiUrl}/proposals/${id}`);
  }

  approveProposal(id: string, comments?: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/proposals/${id}/approve`, { comments });
  }

  returnProposal(id: string, reason: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/proposals/${id}/return`, { reason });
  }

  rejectProposal(id: string, reason: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/proposals/${id}/reject`, { reason });
  }

  getProjects(districtId?: string, status?: string): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (districtId) params = params.set('districtId', districtId);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/projects`, { params });
  }

  getGisProjects(districtId?: string): Observable<ApiResponse<StateGisProject[]>> {
    let params = new HttpParams();
    if (districtId) params = params.set('districtId', districtId);
    return this.http.get<ApiResponse<StateGisProject[]>>(`${this.apiUrl}/gis/projects`, { params });
  }

  getGisParcels(projectId?: string): Observable<ApiResponse<StateGisParcel[]>> {
    let params = new HttpParams();
    if (projectId) params = params.set('projectId', projectId);
    return this.http.get<ApiResponse<StateGisParcel[]>>(`${this.apiUrl}/gis/parcels`, { params });
  }

  getAcquisitionAnalytics(): Observable<ApiResponse<StateAcquisitionAnalytics>> {
    return this.http.get<ApiResponse<StateAcquisitionAnalytics>>(`${this.apiUrl}/acquisition`);
  }
}
