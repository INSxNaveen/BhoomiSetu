import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ENVIRONMENT } from '../config/api.config';
import { ApiResponse } from '../auth/models/auth.models';

export interface PublicStatistics {
  totalProjects: number;
  totalProposals: number;
  totalLandRequiredHectares: number;
  totalLandAcquiredHectares: number;
  totalCompensationAssessedInr: number;
  totalCompensationDisbursedInr: number;
  statesCoveredCount: number;
  districtsCoveredCount: number;
  organizationsCount: number;
  affectedFamiliesCount: number;
  isDemonstrationData: boolean;
  dataSource: string;
  generatedAt: string;
}

export interface StateGeoSummary {
  stateId: string;
  stateCode: string;
  stateName: string;
  projectCount: number;
  districts: DistrictGeoSummary[];
}

export interface DistrictGeoSummary {
  districtId: string;
  districtCode: string;
  districtName: string;
  projectCount: number;
}

export interface PublicInquiryRequest {
  surveyNumber?: string;
  khasraNumber?: string;
  stateName?: string;
  districtName?: string;
}

export interface PublicInquiryResult {
  found: boolean;
  queryEntered: string;
  surveyNumber?: string;
  villageName?: string;
  tehsilName?: string;
  districtName?: string;
  stateName?: string;
  projectName?: string;
  implementingAgency?: string;
  acquisitionStage?: string;
  notificationStatus?: string;
  landType?: string;
  areaHectares?: number;
  dataPrivacyNotice: string;
  requiresCitizenLogin: boolean;
}

export interface PublicNotice {
  id: string;
  noticeNumber: string;
  title: string;
  projectName: string;
  implementingAgency: string;
  stateName: string;
  districtName: string;
  stage: string;
  publishedDate: string;
  summary: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicApiService {
  private http = inject(HttpClient);
  private baseUrl = `${ENVIRONMENT.apiBaseUrl}/public`;

  getStatistics(): Observable<ApiResponse<PublicStatistics>> {
    return this.http.get<ApiResponse<PublicStatistics>>(`${this.baseUrl}/statistics`);
  }

  getGeoSummary(): Observable<ApiResponse<StateGeoSummary[]>> {
    return this.http.get<ApiResponse<StateGeoSummary[]>>(`${this.baseUrl}/geo-summary`);
  }

  checkLandInquiry(request: PublicInquiryRequest): Observable<ApiResponse<PublicInquiryResult>> {
    return this.http.post<ApiResponse<PublicInquiryResult>>(`${this.baseUrl}/inquiry`, request);
  }

  getNotices(): Observable<ApiResponse<PublicNotice[]>> {
    return this.http.get<ApiResponse<PublicNotice[]>>(`${this.baseUrl}/notices`);
  }
}
