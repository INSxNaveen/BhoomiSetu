import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminUser, AdminOrganization } from '../../models/admin.models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  users: AdminUser[] = [];
  organizations: AdminOrganization[] = [];
  loading = false;
  submitting = false;

  // Filter models
  searchQuery = '';
  selectedRole = '';
  selectedOrganization = '';
  selectedStatus = '';

  // Drawer state
  isDrawerOpen = false;
  isEditMode = false;
  editingUserId: string | null = null;
  userForm: FormGroup;
  errorMessage = '';

  // Status toggle confirmation modal state
  selectedUserForToggle: AdminUser | null = null;

  constructor() {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: ['StateAdmin', Validators.required],
      organizationId: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadOrganizations();
    this.loadUsers();
  }

  loadOrganizations() {
    this.adminService.getOrganizations().subscribe({
      next: (res) => {
        if (res.success) {
          this.organizations = res.data;
          if (this.organizations.length > 0 && !this.userForm.value.organizationId) {
            this.userForm.patchValue({ organizationId: this.organizations[0].id });
          }
        }
      }
    });
  }

  loadUsers() {
    this.loading = true;
    const filters: any = {};
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.selectedRole) filters.role = this.selectedRole;
    if (this.selectedOrganization) filters.organizationId = this.selectedOrganization;
    if (this.selectedStatus !== '') filters.isActive = this.selectedStatus === 'true';

    this.adminService.getUsers(filters).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.users = res.data.items || [];
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onFilterChange() {
    this.loadUsers();
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedRole = '';
    this.selectedOrganization = '';
    this.selectedStatus = '';
    this.loadUsers();
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'SuperAdmin': return 'super-admin';
      case 'CentralAdmin': return 'central-admin';
      case 'StateAdmin': return 'state-admin';
      case 'DistrictAdmin': return 'district-admin';
      case 'ProjectAgency': return 'project-agency';
      default: return 'state-admin';
    }
  }

  openAddUserDrawer() {
    this.isEditMode = false;
    this.editingUserId = null;
    this.errorMessage = '';
    this.userForm.reset({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'StateAdmin',
      organizationId: this.organizations.length > 0 ? this.organizations[0].id : '',
      isActive: true
    });
    this.isDrawerOpen = true;
  }

  openEditUserDrawer(user: AdminUser) {
    this.isEditMode = true;
    this.editingUserId = user.id;
    this.errorMessage = '';
    this.userForm.patchValue({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      organizationId: user.organizationId,
      isActive: user.isActive
    });
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
  }

  saveUser() {
    if (this.userForm.invalid) return;
    this.submitting = true;
    this.errorMessage = '';

    const formVal = this.userForm.value;

    if (this.isEditMode && this.editingUserId) {
      this.adminService.updateUser(this.editingUserId, formVal).subscribe({
        next: (res) => {
          this.submitting = false;
          if (res.success) {
            this.closeDrawer();
            this.loadUsers();
          } else {
            this.errorMessage = res.message || 'Failed to update user';
          }
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Error saving user';
        }
      });
    } else {
      this.adminService.createUser(formVal).subscribe({
        next: (res) => {
          this.submitting = false;
          if (res.success) {
            this.closeDrawer();
            this.loadUsers();
          } else {
            this.errorMessage = res.message || 'Failed to create user';
          }
        },
        error: (err) => {
          this.submitting = false;
          this.errorMessage = err.error?.message || 'Error creating user';
        }
      });
    }
  }

  confirmToggleStatus(user: AdminUser) {
    this.selectedUserForToggle = user;
  }

  cancelStatusToggle() {
    this.selectedUserForToggle = null;
  }

  executeStatusToggle() {
    if (!this.selectedUserForToggle) return;
    const u = this.selectedUserForToggle;
    const newStatus = !u.isActive;

    this.adminService.toggleUserStatus(u.id, newStatus).subscribe({
      next: (res) => {
        this.selectedUserForToggle = null;
        this.loadUsers();
      },
      error: () => {
        this.selectedUserForToggle = null;
      }
    });
  }
}
