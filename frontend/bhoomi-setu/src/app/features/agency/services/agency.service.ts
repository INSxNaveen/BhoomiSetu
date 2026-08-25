import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/auth/models/auth.models';

export interface AgencyKpis {
  totalProjects: number;
  draftProposals: number;
  submittedUnderReview: number;
  approvedProjects: number;
  landRequiredHectares: number;
  landAcquiredHectares: number;
  compensationPaid: number;
  delayedProjects: number;
}

export interface AgencyAttentionItem {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'High' | 'Medium' | 'Warning' | 'Info';
  actionRoute: string;
  entityId?: string;
}

export interface AgencyProjectSummary {
  projectId: string;
  projectCode: string;
  projectName: string;
  projectType: string;
  location: string;
  stateName: string;
  districtName: string;
  progressPercentage: number;
  landRequiredHectares: number;
  landAcquiredHectares: number;
  currentStage: string;
  status: string;
  lastUpdated: string;
}

export interface AgencyAcquisitionProgress {
  stage: string;
  parcelsCount: number;
  areaHectares: number;
  percentage: number;
}

export interface AgencyActivityItem {
  id: string;
  title: string;
  description: string;
  actionBy: string;
  role: string;
  timestamp: string;
  entityType: string;
  entityId?: string;
}

export interface AgencyDashboardData {
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  kpis: AgencyKpis;
  attentionItems: AgencyAttentionItem[];
  projects: AgencyProjectSummary[];
  acquisitionProgress: AgencyAcquisitionProgress[];
  recentActivity: AgencyActivityItem[];
  lastUpdated: string;
}

export interface AgencyProposalItem {
  id: string;
  proposalNumber: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  projectType: string;
  stateName: string;
  districtName: string;
  status: string;
  currentStage: string;
  landAreaProposed: number;
  affectedFamilyCount: number;
  estimatedCompensation: number;
  submittedAt?: string;
  createdAt: string;
  lastUpdated: string;
  returnReason?: string;
}

export interface AgencyDocumentSubmission {
  documentType: number;
  fileName: string;
  storagePath: string;
  fileSize: number;
  remarks: string;
}

export interface AgencyProposalCreationRequest {
  projectId?: string;
  isNewProject: boolean;
  projectName: string;
  projectCode: string;
  projectType: number;
  stateId: string;
  districtId: string;
  description: string;
  estimatedCost: number;
  startDate?: string;
  targetCompletionDate?: string;
  landAreaProposed: number;
  tehsilName: string;
  villageName: string;
  surveyNumbers: string;
  landCategory: string;
  affectedFamilyCount: number;
  displacedFamilyCount: number;
  rehabEligibleCount: number;
  estimatedCompensation: number;
  isDraft: boolean;
  documents: AgencyDocumentSubmission[];
}

export interface AgencyDocumentItem {
  id: string;
  documentType: string;
  fileName: string;
  version: number;
  status: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface AgencyWorkspaceCompensation {
  assessedAmount: number;
  approvedAmount: number;
  disbursedAmount: number;
  pendingAmount: number;
  disbursementPercentage: number;
}

export interface AgencyWorkspacePossession {
  totalParcels: number;
  possessionTakenCount: number;
  pendingCount: number;
  possessionHectares: number;
  completionPercentage: number;
}

export interface AgencyWorkspaceRehabilitation {
  totalAffectedFamilies: number;
  displacedFamilies: number;
  eligibleCases: number;
  completedCases: number;
  totalGrantsDisbursed: number;
  completionPercentage: number;
}

export interface AgencyMilestoneItem {
  id: string;
  name: string;
  description: string;
  plannedDate: string;
  actualDate?: string;
  status: string;
  sequenceNumber: number;
  isDelayed: boolean;
}

export interface AgencyProjectWorkspace {
  projectId: string;
  projectCode: string;
  projectName: string;
  description: string;
  projectType: string;
  organizationName: string;
  stateName: string;
  districtName: string;
  estimatedCost: number;
  requiredAreaHectares: number;
  acquiredAreaHectares: number;
  overallProgress: number;
  status: string;
  currentStage: string;
  startDate?: string;
  targetCompletionDate?: string;
  landParcels: any[];
  documents: AgencyDocumentItem[];
  compensation: AgencyWorkspaceCompensation;
  possession: AgencyWorkspacePossession;
  rehabilitation: AgencyWorkspaceRehabilitation;
  timeline: AgencyMilestoneItem[];
}

export interface AgencyWorkflowStage {
  stageName: string;
  label: string;
  status: 'Completed' | 'Current' | 'Pending' | 'Returned' | 'Rejected';
  completedDate?: string;
  actor?: string;
  remarks?: string;
}

export interface AgencyTrackingItem {
  proposalId: string;
  proposalNumber: string;
  projectId: string;
  projectName: string;
  currentStage: string;
  status: string;
  submittedDate?: string;
  lastUpdated: string;
  workflowStages: AgencyWorkflowStage[];
  activityHistory: AgencyActivityItem[];
  returnRemarks?: string;
}

import { ENVIRONMENT } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AgencyService {
  private http = inject(HttpClient);
  private apiUrl = `${ENVIRONMENT.apiBaseUrl}/agency`;
  private authUrl = `${ENVIRONMENT.apiBaseUrl}/auth`;

  getDashboard(organizationId?: string): Observable<ApiResponse<AgencyDashboardData>> {
    let params = new HttpParams();
    if (organizationId) params = params.set('organizationId', organizationId);
    return this.http.get<ApiResponse<AgencyDashboardData>>(`${this.apiUrl}/dashboard`, { params });
  }

  getProjects(filters?: {
    search?: string;
    projectType?: number;
    status?: number;
    stateId?: string;
    districtId?: string;
  }): Observable<ApiResponse<AgencyProjectSummary[]>> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.projectType !== undefined) params = params.set('projectType', filters.projectType.toString());
    if (filters?.status !== undefined) params = params.set('status', filters.status.toString());
    if (filters?.stateId) params = params.set('stateId', filters.stateId);
    if (filters?.districtId) params = params.set('districtId', filters.districtId);
    return this.http.get<ApiResponse<AgencyProjectSummary[]>>(`${this.apiUrl}/projects`, { params });
  }

  getProjectWorkspace(id: string): Observable<ApiResponse<AgencyProjectWorkspace>> {
    return this.http.get<ApiResponse<AgencyProjectWorkspace>>(`${this.apiUrl}/projects/${id}`);
  }

  getProposals(filters?: { search?: string; status?: number }): Observable<ApiResponse<AgencyProposalItem[]>> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.status !== undefined) params = params.set('status', filters.status.toString());
    return this.http.get<ApiResponse<AgencyProposalItem[]>>(`${this.apiUrl}/proposals`, { params });
  }

  getProposalById(id: string): Observable<ApiResponse<AgencyProposalItem>> {
    return this.http.get<ApiResponse<AgencyProposalItem>>(`${this.apiUrl}/proposals/${id}`);
  }

  createProposal(payload: AgencyProposalCreationRequest): Observable<ApiResponse<AgencyProposalItem>> {
    return this.http.post<ApiResponse<AgencyProposalItem>>(`${this.apiUrl}/proposals`, payload);
  }

  updateProposalDraft(id: string, payload: AgencyProposalCreationRequest): Observable<ApiResponse<AgencyProposalItem>> {
    return this.http.put<ApiResponse<AgencyProposalItem>>(`${this.apiUrl}/proposals/${id}`, payload);
  }

  submitProposal(id: string): Observable<ApiResponse<AgencyProposalItem>> {
    return this.http.post<ApiResponse<AgencyProposalItem>>(`${this.apiUrl}/proposals/${id}/submit`, {});
  }

  attachDocument(id: string, doc: AgencyDocumentSubmission): Observable<ApiResponse<AgencyDocumentItem>> {
    return this.http.post<ApiResponse<AgencyDocumentItem>>(`${this.apiUrl}/proposals/${id}/documents`, doc);
  }

  getTrackingList(filters?: { search?: string; status?: string }): Observable<ApiResponse<AgencyTrackingItem[]>> {
    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.status) params = params.set('status', filters.status);
    return this.http.get<ApiResponse<AgencyTrackingItem[]>>(`${this.apiUrl}/tracking`, { params });
  }

  getTrackingDetail(proposalId: string): Observable<ApiResponse<AgencyTrackingItem>> {
    return this.http.get<ApiResponse<AgencyTrackingItem>>(`${this.apiUrl}/tracking/${proposalId}`);
  }

  getGeography(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.authUrl}/geography`);
  }
}
