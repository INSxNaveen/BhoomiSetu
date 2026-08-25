export interface RoleAccessConfig {
  role: string;
  allowedFeatures: string[];
  permissions: string[];
}

export const SUPER_ADMIN_CONFIG: RoleAccessConfig = {
  role: 'SuperAdmin',
  allowedFeatures: ['dashboard', 'projects', 'proposals', 'gis', 'parcels', 'compensation', 'possession', 'rehabilitation', 'reports', 'notifications', 'audit', 'administration'],
  permissions: ['*']
};

export const CENTRAL_ADMIN_CONFIG: RoleAccessConfig = {
  role: 'CentralAdmin',
  allowedFeatures: ['dashboard', 'projects', 'proposals', 'gis', 'parcels', 'compensation', 'possession', 'rehabilitation', 'reports', 'notifications', 'audit'],
  permissions: ['project.view', 'proposal.view', 'gis.view', 'compensation.view', 'possession.view', 'rehabilitation.view', 'report.view']
};

export const STATE_ADMIN_CONFIG: RoleAccessConfig = {
  role: 'StateAdmin',
  allowedFeatures: ['dashboard', 'projects', 'proposals', 'gis', 'parcels', 'compensation', 'possession', 'rehabilitation', 'reports', 'notifications'],
  permissions: ['project.view', 'proposal.view', 'proposal.approve', 'gis.view', 'compensation.view', 'possession.view', 'rehabilitation.view', 'report.view']
};

export const DISTRICT_ADMIN_CONFIG: RoleAccessConfig = {
  role: 'DistrictAdmin',
  allowedFeatures: ['dashboard', 'projects', 'proposals', 'gis', 'parcels', 'compensation', 'possession', 'rehabilitation', 'notifications'],
  permissions: ['project.view', 'proposal.view', 'proposal.verify', 'gis.view', 'compensation.view', 'possession.record', 'rehabilitation.view']
};

export const PROJECT_AGENCY_CONFIG: RoleAccessConfig = {
  role: 'ProjectAgency',
  allowedFeatures: ['dashboard', 'projects', 'proposals', 'gis', 'parcels', 'compensation', 'possession', 'rehabilitation', 'notifications'],
  permissions: ['project.view', 'project.create', 'proposal.view', 'proposal.submit', 'gis.view', 'compensation.view', 'possession.view', 'rehabilitation.view']
};

export const CITIZEN_CONFIG: RoleAccessConfig = {
  role: 'Citizen',
  allowedFeatures: ['dashboard', 'gis', 'parcels', 'compensation', 'possession', 'rehabilitation', 'notifications', 'reports'],
  permissions: ['gis.view', 'compensation.view', 'possession.view', 'rehabilitation.view', 'report.view']
};

