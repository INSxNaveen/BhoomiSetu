export interface AdminDashboardKpi {
  totalUsers: number;
  activeOrganizations: number;
  totalProjects: number;
  activeStates: number;
  apiStatus: string;
  systemStatus: string;
}

export interface ServiceHealthItem {
  serviceName: string;
  status: 'Operational' | 'Degraded' | 'Unavailable';
  uptime: string;
  details: string;
}

export interface UserDistribution {
  roleName: string;
  userCount: number;
  percentage: number;
}

export interface AuditActivityLog {
  id: string;
  userId?: string;
  username: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValuesJson?: string;
  newValuesJson?: string;
  ipAddress: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  organizationId: string;
  organizationName: string;
  stateId?: string;
  stateName?: string;
  districtId?: string;
  districtName?: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateAdminUserRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  organizationId: string;
  stateId?: string;
  districtId?: string;
  isActive?: boolean;
}

export interface AdminOrganization {
  id: string;
  name: string;
  code: string;
  organizationType: number | string;
  stateId?: string;
  stateName?: string;
  districtId?: string;
  districtName?: string;
  contactEmail: string;
  isActive: boolean;
  userCount: number;
  projectCount: number;
  createdAt: string;
}

export interface CreateAdminOrganizationRequest {
  name: string;
  code: string;
  organizationType: number;
  stateId?: string;
  districtId?: string;
  contactEmail: string;
  isActive?: boolean;
}

export interface AdminRole {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
}

export interface PermissionMatrixItem {
  permissionId: string;
  code: string;
  name: string;
  module: string;
  action: string;
  isGranted: boolean;
}

export interface RolePermissionsMatrix {
  roleId: string;
  roleName: string;
  roleDescription: string;
  permissions: PermissionMatrixItem[];
}
