import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/pages/landing.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { MainLayoutComponent } from './core/layout/main-layout/main-layout.component';
import { AdminLayoutComponent } from './core/layout/admin-layout/admin-layout.component';
import { CentralLayoutComponent } from './core/layout/central-layout/central-layout.component';

import { DashboardComponent } from './features/dashboard/pages/dashboard.component';
import { ProjectListComponent } from './features/projects/pages/project-list.component';
import { ProposalListComponent } from './features/proposals/pages/proposal-list.component';
import { LandMapComponent } from './features/gis/pages/land-map.component';
import { CompensationComponent } from './features/compensation/pages/compensation.component';
import { PossessionComponent } from './features/possession/pages/possession.component';
import { RehabilitationComponent } from './features/rehabilitation/pages/rehabilitation.component';
import { ParcelListComponent } from './features/parcels/pages/parcel-list.component';
import { ReportsComponent } from './features/reports/pages/reports.component';
import { NotificationCenterComponent } from './features/notifications/pages/notification-center.component';
import { AuditLogComponent } from './features/audit/pages/audit-log.component';

import { AdminDashboardComponent } from './features/administration/pages/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './features/administration/pages/user-management/user-management.component';
import { OrganizationAccessComponent } from './features/administration/pages/organization-access/organization-access.component';

import { NationalDashboardComponent } from './features/central-admin/pages/national-dashboard/national-dashboard.component';
import { NationalGisComponent } from './features/central-admin/pages/national-gis/national-gis.component';
import { CentralReportsComponent } from './features/central-admin/pages/central-reports/central-reports.component';

import { StateLayoutComponent } from './core/layout/state-layout/state-layout.component';
import { StateDashboardComponent } from './features/state-admin/pages/state-dashboard/state-dashboard.component';
import { ProposalReviewComponent } from './features/state-admin/pages/proposal-review/proposal-review.component';
import { StateProjectsGisComponent } from './features/state-admin/pages/state-projects-gis/state-projects-gis.component';
import { StateAcquisitionComponent } from './features/state-admin/pages/state-acquisition/state-acquisition.component';

import { DistrictLayoutComponent } from './core/layout/district-layout/district-layout.component';
import { DistrictDashboardComponent } from './features/district-admin/pages/district-dashboard/district-dashboard.component';
import { DistrictProjectsComponent } from './features/district-admin/pages/district-projects/district-projects.component';
import { FieldVerificationComponent } from './features/district-admin/pages/field-verification/field-verification.component';
import { JointSurveyComponent } from './features/district-admin/pages/joint-survey/joint-survey.component';
import { DistrictGisComponent } from './features/district-admin/pages/district-gis/district-gis.component';
import { DistrictCompensationComponent } from './features/district-admin/pages/district-compensation/district-compensation.component';
import { DistrictPossessionComponent } from './features/district-admin/pages/district-possession/district-possession.component';
import { DistrictRehabilitationComponent } from './features/district-admin/pages/district-rehabilitation/district-rehabilitation.component';
import { DistrictReportsComponent } from './features/district-admin/pages/district-reports/district-reports.component';

import { AgencyLayoutComponent } from './core/layout/agency-layout/agency-layout.component';
import { AgencyDashboardComponent } from './features/agency/pages/agency-dashboard/agency-dashboard.component';
import { CreateProposalComponent } from './features/agency/pages/create-proposal/create-proposal.component';
import { MyProjectsComponent } from './features/agency/pages/my-projects/my-projects.component';
import { ProjectWorkspaceComponent } from './features/agency/pages/project-workspace/project-workspace.component';
import { ProposalTrackingComponent } from './features/agency/pages/proposal-tracking/proposal-tracking.component';

import { authGuard } from './core/auth/guards/auth.guard';
import { roleGuard } from './core/auth/guards/role.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'agency',
    component: AgencyLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ProjectAgency', 'SuperAdmin'] },
    children: [
      { path: 'dashboard', component: AgencyDashboardComponent },
      { path: 'proposals/create', component: CreateProposalComponent },
      { path: 'projects', component: MyProjectsComponent },
      { path: 'projects/:projectId', component: ProjectWorkspaceComponent },
      { path: 'tracking', component: ProposalTrackingComponent },
      { path: 'notifications', component: NotificationCenterComponent },
      { path: 'audit', component: AuditLogComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['SuperAdmin'] },
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'organizations', component: OrganizationAccessComponent },
      { path: 'audit', component: AuditLogComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'central',
    component: CentralLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CentralAdmin', 'SuperAdmin'] },
    children: [
      { path: 'dashboard', component: NationalDashboardComponent },
      { path: 'gis', component: NationalGisComponent },
      { path: 'reports', component: CentralReportsComponent },
      { path: 'notifications', component: NotificationCenterComponent },
      { path: 'audit', component: AuditLogComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'state',
    component: StateLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['StateAdmin', 'SuperAdmin'] },
    children: [
      { path: 'dashboard', component: StateDashboardComponent },
      { path: 'proposals', component: ProposalReviewComponent },
      { path: 'projects', component: StateProjectsGisComponent },
      { path: 'acquisition', component: StateAcquisitionComponent },
      { path: 'notifications', component: NotificationCenterComponent },
      { path: 'audit', component: AuditLogComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'district',
    component: DistrictLayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DistrictAdmin', 'SuperAdmin'] },
    children: [
      { path: 'dashboard', component: DistrictDashboardComponent },
      { path: 'projects', component: DistrictProjectsComponent },
      { path: 'verification', component: FieldVerificationComponent },
      { path: 'surveys', component: JointSurveyComponent },
      { path: 'gis', component: DistrictGisComponent },
      { path: 'compensation', component: DistrictCompensationComponent },
      { path: 'possession', component: DistrictPossessionComponent },
      { path: 'rehabilitation', component: DistrictRehabilitationComponent },
      { path: 'reports', component: DistrictReportsComponent },
      { path: 'notifications', component: NotificationCenterComponent },
      { path: 'audit', component: AuditLogComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'projects', component: ProjectListComponent },
      { path: 'proposals', component: ProposalListComponent },
      { path: 'gis', component: LandMapComponent },
      { path: 'parcels', component: ParcelListComponent },
      { path: 'compensation', component: CompensationComponent },
      { path: 'possession', component: PossessionComponent },
      { path: 'rehabilitation', component: RehabilitationComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'notifications', component: NotificationCenterComponent },
      { path: 'audit', component: AuditLogComponent },
      { path: 'administration', component: AdminDashboardComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
