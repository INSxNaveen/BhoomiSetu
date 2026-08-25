import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../../../core/config/api.config';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface DistrictKpis {
  activeProjects: number;
  totalLandParcels: number;
  totalLandRequiredHectares: number;
  totalLandAcquiredHectares: number;
  landAcquisitionPercentage: number;
  pendingVerificationsCount: number;
  totalCompensationAssessed: number;
  totalCompensationDisbursed: number;
  compensationDisbursementPercentage: number;
  pendingPossessionsCount: number;
  affectedFamiliesCount: number;
  displacedFamiliesCount: number;
  rrCompletedCount: number;
  rrProgressPercentage: number;
}

export interface PipelineStage {
  stageId: string;
  stageName: string;
  count: number;
  percentage: number;
  description: string;
}

export interface DistrictVerificationSummary {
  pending: number;
  verified: number;
  returned: number;
}

export interface DistrictTehsilProgress {
  tehsilId: string;
  tehsilName: string;
  parcelsCount: number;
  landAreaHectares: number;
  verifiedCount: number;
  compensationDisbursed: number;
  status: string;
}

export interface DistrictDelayedMilestone {
  projectId: string;
  projectName: string;
  milestoneName: string;
  daysDelayed: number;
  status: string;
}

export interface DistrictActivity {
  title: string;
  description: string;
  timestamp: string;
  type: string;
}

export interface DistrictDashboardData {
  districtId: string;
  districtName: string;
  districtCode: string;
  stateName: string;
  lastUpdated: string;
  kpis: DistrictKpis;
  pipeline: PipelineStage[];
  verificationSummary: DistrictVerificationSummary;
  tehsilBreakdown: DistrictTehsilProgress[];
  delayedMilestones: DistrictDelayedMilestone[];
  recentActivity: DistrictActivity[];
}

export interface DistrictVerificationItem {
  id: string;
  parcelId: string;
  parcelNumber: string;
  surveyNumber: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  tehsilName: string;
  villageName: string;
  areaHectares: number;
  landType: string;
  ownerNames: string[];
  verificationStatus: string;
  submittedAt: string;
  proposalNumber: string;
  comments: string;
}

export interface DistrictJointSurvey {
  id: string;
  parcelId: string;
  surveyNumber: string;
  parcelNumber: string;
  projectId: string;
  projectName: string;
  tehsilName: string;
  villageName: string;
  scheduledDate: string;
  surveyTeamLeader: string;
  status: string;
  remarks: string;
}

export interface DistrictCompensationItem {
  assessmentId: string;
  parcelId: string;
  surveyNumber: string;
  parcelNumber: string;
  projectName: string;
  tehsilName: string;
  villageName: string;
  ownerName: string;
  assessedAmount: number;
  solatiumAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: string;
  assessedAt: string;
  disbursedAmount: number;
  paymentDate?: string;
  paymentReference?: string;
}

export interface DistrictCompensationSummary {
  totalAssessed: number;
  totalApproved: number;
  totalDisbursed: number;
  totalPending: number;
  totalAssessments: number;
  paidAssessments: number;
  assessments: DistrictCompensationItem[];
}

export interface DistrictPossessionItem {
  recordId: string;
  parcelId: string;
  surveyNumber: string;
  parcelNumber: string;
  projectId: string;
  projectName: string;
  tehsilName: string;
  villageName: string;
  ownerName: string;
  areaHectares: number;
  possessionStatus: string;
  possessionDate?: string;
  handedOverByName: string;
  verifiedByName: string;
  remarks: string;
}

export interface DistrictPossessionSummary {
  totalParcels: number;
  possessionTakenCount: number;
  noticeIssuedCount: number;
  pendingCount: number;
  possessionCompletedHectares: number;
  completionPercentage: number;
  records: DistrictPossessionItem[];
}

export interface DistrictRehabilitationItem {
  caseId: string;
  familyId: string;
  familyReference: string;
  headOfFamilyName: string;
  villageName: string;
  projectName: string;
  familySize: number;
  isDisplaced: boolean;
  status: string;
  rehabilitationSite: string;
  eligibleAmount: number;
  providedAmount: number;
  completionDate?: string;
  benefitsCount: number;
  remarks: string;
}

export interface DistrictRehabilitationSummary {
  totalAffectedFamilies: number;
  displacedFamilies: number;
  eligibleForRr: number;
  completedCases: number;
  totalEligibleAmount: number;
  totalProvidedAmount: number;
  completionPercentage: number;
  cases: DistrictRehabilitationItem[];
}

export interface DistrictReportData {
  districtName: string;
  stateName: string;
  generatedAt: string;
  metrics: DistrictKpis;
  tehsilProgress: DistrictTehsilProgress[];
  monthlyTrends: any[];
  compensationSummary: DistrictCompensationSummary;
  possessionSummary: DistrictPossessionSummary;
  rehabilitationSummary: DistrictRehabilitationSummary;
}

@Injectable({
  providedIn: 'root'
})
export class DistrictAdminService {
  private http = inject(HttpClient);
  private apiUrl = `${ENVIRONMENT.apiBaseUrl}/district`;

  getDashboard(tehsilId?: string, projectType?: string): Observable<ApiResponse<DistrictDashboardData>> {
    let params = new HttpParams();
    if (tehsilId) params = params.set('tehsilId', tehsilId);
    if (projectType) params = params.set('projectType', projectType);
    return this.http.get<ApiResponse<DistrictDashboardData>>(`${this.apiUrl}/dashboard`, { params });
  }

  getProjects(status?: string, projectType?: string, search?: string): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (projectType) params = params.set('projectType', projectType);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/projects`, { params });
  }

  getProjectById(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/projects/${id}`);
  }

  getVerifications(status?: string, search?: string): Observable<ApiResponse<DistrictVerificationItem[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<DistrictVerificationItem[]>>(`${this.apiUrl}/verifications`, { params });
  }

  verifyFieldParcel(id: string, comments?: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/verifications/${id}/verify`, { comments });
  }

  returnFieldVerification(id: string, reason: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/verifications/${id}/return`, { reason });
  }

  getSurveys(): Observable<ApiResponse<DistrictJointSurvey[]>> {
    return this.http.get<ApiResponse<DistrictJointSurvey[]>>(`${this.apiUrl}/surveys`);
  }

  updateSurveyStatus(id: string, comments?: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/surveys/${id}/status`, { comments });
  }

  getGisProjects(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/gis/projects`);
  }

  getGisParcels(projectId?: string): Observable<ApiResponse<any[]>> {
    let params = new HttpParams();
    if (projectId) params = params.set('projectId', projectId);
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/gis/parcels`, { params });
  }

  getCompensation(): Observable<ApiResponse<DistrictCompensationSummary>> {
    return this.http.get<ApiResponse<DistrictCompensationSummary>>(`${this.apiUrl}/compensation`);
  }

  getPossession(): Observable<ApiResponse<DistrictPossessionSummary>> {
    return this.http.get<ApiResponse<DistrictPossessionSummary>>(`${this.apiUrl}/possession`);
  }

  takePossession(id: string, comments?: string): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.apiUrl}/possession/${id}/take-possession`, { comments });
  }

  getRehabilitation(): Observable<ApiResponse<DistrictRehabilitationSummary>> {
    return this.http.get<ApiResponse<DistrictRehabilitationSummary>>(`${this.apiUrl}/rehabilitation`);
  }

  getReports(): Observable<ApiResponse<DistrictReportData>> {
    return this.http.get<ApiResponse<DistrictReportData>>(`${this.apiUrl}/reports`);
  }
}
