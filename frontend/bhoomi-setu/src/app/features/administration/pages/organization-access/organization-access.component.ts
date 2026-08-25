import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import {
  AdminOrganization,
  AdminRole,
  RolePermissionsMatrix,
  PermissionMatrixItem
} from '../../models/admin.models';

interface ModulePermissionRow {
  module: string;
  viewPerm?: PermissionMatrixItem;
  createPerm?: PermissionMatrixItem;
  editPerm?: PermissionMatrixItem;
  approvePerm?: PermissionMatrixItem;
}

@Component({
  selector: 'app-organization-access',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './organization-access.component.html',
  styleUrl: './organization-access.component.scss'
})
export class OrganizationAccessComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  activeTab: 'orgs' | 'roles' = 'orgs';

  // Organizations tab
  organizations: AdminOrganization[] = [];
  isOrgDrawerOpen = false;
  submittingOrg = false;
  orgForm: FormGroup;

  // Roles & Permissions tab
  roles: AdminRole[] = [];
  selectedRole: AdminRole | null = null;
  permissionMatrix: RolePermissionsMatrix | null = null;
  permissionRows: ModulePermissionRow[] = [];
  savingPermissions = false;
  saveSuccessMessage = '';

  constructor() {
    this.orgForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      organizationType: [1, Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadOrganizations();
    this.loadRoles();
  }

  setActiveTab(tab: 'orgs' | 'roles') {
    this.activeTab = tab;
  }

  getOrgTypeLabel(type: number | string): string {
    switch (Number(type)) {
      case 0: return 'Central Ministry';
      case 1: return 'State Government';
      case 2: return 'District Collectorate';
      case 3: return 'Project Agency';
      default: return 'Government Body';
    }
  }

  loadOrganizations() {
    this.adminService.getOrganizations().subscribe({
      next: (res) => { if (res.success) this.organizations = res.data; }
    });
  }

  openAddOrgDrawer() {
    this.orgForm.reset({
      name: '',
      code: '',
      organizationType: 1,
      contactEmail: '',
      isActive: true
    });
    this.isOrgDrawerOpen = true;
  }

  closeOrgDrawer() {
    this.isOrgDrawerOpen = false;
  }

  createOrganization() {
    if (this.orgForm.invalid) return;
    this.submittingOrg = true;
    this.adminService.createOrganization(this.orgForm.value).subscribe({
      next: (res) => {
        this.submittingOrg = false;
        if (res.success) {
          this.closeOrgDrawer();
          this.loadOrganizations();
        }
      },
      error: () => {
        this.submittingOrg = false;
      }
    });
  }

  // --- Roles & Permissions ---

  loadRoles() {
    this.adminService.getRoles().subscribe({
      next: (res) => {
        if (res.success) {
          this.roles = res.data;
          if (this.roles.length > 0) {
            this.selectRole(this.roles[0]);
          }
        }
      }
    });
  }

  selectRole(role: AdminRole) {
    this.selectedRole = role;
    this.saveSuccessMessage = '';
    this.adminService.getRolePermissionsMatrix(role.id).subscribe({
      next: (res) => {
        if (res.success) {
          this.permissionMatrix = res.data;
          this.buildModuleRows(this.permissionMatrix?.permissions || []);
        }
      }
    });
  }

  buildModuleRows(items: PermissionMatrixItem[]) {
    const map = new Map<string, ModulePermissionRow>();

    items.forEach(p => {
      let row = map.get(p.module);
      if (!row) {
        row = { module: p.module };
        map.set(p.module, row);
      }
      const act = p.action.toLowerCase();
      if (act === 'view' || act.includes('read')) row.viewPerm = p;
      else if (act === 'create' || act.includes('write')) row.createPerm = p;
      else if (act === 'edit' || act.includes('update')) row.editPerm = p;
      else if (act === 'approve' || act.includes('manage')) row.approvePerm = p;
      else row.viewPerm = p;
    });

    this.permissionRows = Array.from(map.values());
  }

  togglePermission(perm: PermissionMatrixItem) {
    perm.isGranted = !perm.isGranted;
  }

  savePermissions() {
    if (!this.selectedRole || !this.permissionMatrix) return;
    this.savingPermissions = true;
    this.saveSuccessMessage = '';

    const grantedIds = this.permissionMatrix.permissions
      .filter(p => p.isGranted)
      .map(p => p.permissionId);

    this.adminService.updateRolePermissions(this.selectedRole.id, grantedIds).subscribe({
      next: (res) => {
        this.savingPermissions = false;
        if (res.success) {
          this.saveSuccessMessage = `Successfully updated permissions for ${this.selectedRole?.name}.`;
          this.loadRoles();
        }
      },
      error: () => {
        this.savingPermissions = false;
      }
    });
  }
}
