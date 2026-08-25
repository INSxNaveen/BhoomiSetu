import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminDashboardKpi,
  ServiceHealthItem,
  UserDistribution,
  AuditActivityLog,
  AdminUser,
  CreateAdminUserRequest,
  AdminOrganization,
  CreateAdminOrganizationRequest,
  AdminRole,
  RolePermissionsMatrix
} from '../models/admin.models';

import { ENVIRONMENT } from '../../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${ENVIRONMENT.apiBaseUrl}/admin`;

  getDashboardKpis(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  getSystemHealth(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/system/health`);
  }

  getRecentActivity(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/activity`);
  }

  getUserDistribution(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/users/distribution`);
  }

  getUsers(filters: { search?: string; role?: string; organizationId?: string; isActive?: boolean; pageNumber?: number; pageSize?: number }): Observable<any> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.role) params = params.set('role', filters.role);
    if (filters.organizationId) params = params.set('organizationId', filters.organizationId);
    if (filters.isActive !== undefined && filters.isActive !== null) params = params.set('isActive', filters.isActive);
    if (filters.pageNumber) params = params.set('pageNumber', filters.pageNumber);
    if (filters.pageSize) params = params.set('pageSize', filters.pageSize);

    return this.http.get<any>(`${this.baseUrl}/users`, { params });
  }

  createUser(req: CreateAdminUserRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/users`, req);
  }

  updateUser(id: string, req: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/users/${id}`, req);
  }

  toggleUserStatus(id: string, isActive: boolean): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/users/${id}/status`, isActive);
  }

  getOrganizations(search?: string, isActive?: boolean): Observable<any> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (isActive !== undefined && isActive !== null) params = params.set('isActive', isActive);

    return this.http.get<any>(`${this.baseUrl}/organizations`, { params });
  }

  createOrganization(req: CreateAdminOrganizationRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/organizations`, req);
  }

  getRoles(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/roles`);
  }

  getRolePermissionsMatrix(roleId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/roles/${roleId}/permissions`);
  }

  updateRolePermissions(roleId: string, grantedPermissionIds: string[]): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/roles/${roleId}/permissions`, { grantedPermissionIds });
  }
}
