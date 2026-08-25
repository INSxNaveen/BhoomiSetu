import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  NationalDashboardData,
  NationalGisProject,
  NationalReportAnalytics
} from '../models/central-admin.models';

import { ENVIRONMENT } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class CentralAdminService {
  private http = inject(HttpClient);
  private baseUrl = `${ENVIRONMENT.apiBaseUrl}/central`;

  getDashboard(): Observable<{ success: boolean; data: NationalDashboardData; message?: string }> {
    return this.http.get<{ success: boolean; data: NationalDashboardData; message?: string }>(`${this.baseUrl}/dashboard`);
  }

  getGisProjects(filters?: {
    stateId?: string;
    districtId?: string;
    projectType?: number | string;
    status?: number | string;
  }): Observable<{ success: boolean; data: NationalGisProject[]; message?: string }> {
    let params = new HttpParams();
    if (filters?.stateId) params = params.set('stateId', filters.stateId);
    if (filters?.districtId) params = params.set('districtId', filters.districtId);
    if (filters?.projectType !== undefined && filters?.projectType !== '') params = params.set('projectType', filters.projectType.toString());
    if (filters?.status !== undefined && filters?.status !== '') params = params.set('status', filters.status.toString());

    return this.http.get<{ success: boolean; data: NationalGisProject[]; message?: string }>(`${this.baseUrl}/gis/projects`, { params });
  }

  getGisParcels(filters?: {
    projectId?: string;
    stateId?: string;
    districtId?: string;
  }): Observable<{ success: boolean; data: any[]; message?: string }> {
    let params = new HttpParams();
    if (filters?.projectId) params = params.set('projectId', filters.projectId);
    if (filters?.stateId) params = params.set('stateId', filters.stateId);
    if (filters?.districtId) params = params.set('districtId', filters.districtId);

    return this.http.get<{ success: boolean; data: any[]; message?: string }>(`${this.baseUrl}/gis/parcels`, { params });
  }

  getReportAnalytics(filters?: {
    stateId?: string;
    projectType?: number | string;
    year?: number;
  }): Observable<{ success: boolean; data: NationalReportAnalytics; message?: string }> {
    let params = new HttpParams();
    if (filters?.stateId) params = params.set('stateId', filters.stateId);
    if (filters?.projectType !== undefined && filters?.projectType !== '') params = params.set('projectType', filters.projectType.toString());
    if (filters?.year) params = params.set('year', filters.year.toString());

    return this.http.get<{ success: boolean; data: NationalReportAnalytics; message?: string }>(`${this.baseUrl}/reports/analytics`, { params });
  }
}
