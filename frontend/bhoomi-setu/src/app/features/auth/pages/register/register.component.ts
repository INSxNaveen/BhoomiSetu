import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, RegisterRoleOption, StateGeography } from '../../../../core/auth/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  roles: RegisterRoleOption[] = [
    { 
      code: 'CentralAdmin', 
      name: 'Central Ministry Admin', 
      badge: 'MoRTH / MoRD',
      description: 'National Operations Command Center & Multi-State Corridor Oversight', 
      level: 'National Operations',
      icon: '🏛️'
    },
    { 
      code: 'StateAdmin', 
      name: 'State Revenue Authority', 
      badge: 'State Govt',
      description: 'State Land Acquisition, Revenue Department & Approval Sanctions', 
      level: 'State Level',
      icon: '🏢'
    },
    { 
      code: 'DistrictAdmin', 
      name: 'District Collector / CALA', 
      badge: 'District Admin',
      description: 'Competent Authority for Land Acquisition, Field Survey & Award Sanction', 
      level: 'District Level',
      icon: '📋'
    },
    { 
      code: 'ProjectAgency', 
      name: 'Project Implementing Agency', 
      badge: 'NHAI / DFCCIL / PWD',
      description: 'Highway / Railway Engineering, Alignment Drawings & Proposal Submissions', 
      level: 'Implementing Agency',
      icon: '🏗️'
    },
    { 
      code: 'Citizen', 
      name: 'Citizen / Landowner', 
      badge: 'Public Portal',
      description: 'Land Parcel Verification, Compensation Status & DBT Disbursal Tracking', 
      level: 'Citizen Portal',
      icon: '👤'
    }
  ];

  statesList: StateGeography[] = [];
  filteredDistricts: { id: string; name: string; code: string }[] = [];

  regData = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    role: 'CentralAdmin',
    stateId: '',
    districtId: '',
    organizationName: '',
    designation: '',
    password: ''
  };

  confirmPassword = '';
  showPassword = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.loadRolesAndGeography();
  }

  loadRolesAndGeography() {
    this.authService.getRoles().subscribe({
      next: (res) => {
        if (res.success && res.data && res.data.length > 0) {
          this.roles = res.data;
        }
      },
      error: () => {
        // Fallback to predefined 5 non-superadmin roles
      }
    });

    this.authService.getGeography().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.statesList = res.data;
        }
      },
      error: () => {
        // Handled gracefully
      }
    });
  }

  selectRole(roleCode: string) {
    this.regData.role = roleCode;
    this.onStateChange();
  }

  onStateChange() {
    if (!this.regData.stateId) {
      this.filteredDistricts = [];
      this.regData.districtId = '';
      return;
    }

    const selectedState = this.statesList.find(s => s.id === this.regData.stateId);
    this.filteredDistricts = selectedState ? selectedState.districts : [];
    this.regData.districtId = '';
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  onRegister() {
    if (!this.regData.firstName.trim() || !this.regData.username.trim() || !this.regData.email.trim() || !this.regData.password) {
      this.errorMessage = 'Please complete all required fields (Name, Username, Email, Password).';
      return;
    }

    if (this.regData.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match. Please re-enter identical passwords.';
      return;
    }

    if (this.regData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters long for security compliance.';
      return;
    }

    // Role specific requirements
    if ((this.regData.role === 'DistrictAdmin' || this.regData.role === 'StateAdmin') && !this.regData.stateId) {
      this.errorMessage = 'Please select your State jurisdiction.';
      return;
    }

    if (this.regData.role === 'DistrictAdmin' && !this.regData.districtId) {
      this.errorMessage = 'Please select your District jurisdiction.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      firstName: this.regData.firstName.trim(),
      lastName: this.regData.lastName.trim(),
      username: this.regData.username.trim(),
      email: this.regData.email.trim(),
      phone: this.regData.phone.trim(),
      role: this.regData.role,
      password: this.regData.password,
      stateId: this.regData.stateId ? this.regData.stateId : null,
      districtId: this.regData.districtId ? this.regData.districtId : null
    };

    this.authService.register(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.successMessage = 'Registration successful! Redirecting to Sign In...';
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: {
                registered: 'true',
                username: this.regData.username.trim()
              }
            });
          }, 1200);
        } else {
          this.errorMessage = res.message || 'Registration failed.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Registration failed. Username or email may already be in use.';
      }
    });
  }
}
