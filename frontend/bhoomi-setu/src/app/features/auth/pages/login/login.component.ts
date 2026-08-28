import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';

export interface EnterprisePersona {
  roleName: string;
  badge: string;
  username: string;
  password: string;
  description: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  username = '';
  password = '';
  showPassword = false;
  rememberMe = true;
  loading = false;
  errorMessage = '';
  successMessage = '';
  selectedPersona: string | null = null;

  enterprisePersonas: EnterprisePersona[] = [
    {
      roleName: 'Super Administrator',
      badge: 'Platform Governance',
      username: 'super.admin',
      password: 'Admin@123',
      description: 'Full platform governance, tenant configuration & immutable audit ledger',
      icon: '⚙️'
    },
    {
      roleName: 'National Asset Director',
      badge: 'Central Portfolio',
      username: 'central.admin',
      password: 'Central@123',
      description: 'Macro portfolio analytics, cross-corridor tracking & capital sanctions',
      icon: '🏛️'
    },
    {
      roleName: 'State Infrastructure Director',
      badge: 'State Operations',
      username: 'state.admin',
      password: 'State@123',
      description: 'Regional corridor approvals, cadastral GIS review & land acquisition cells',
      icon: '🏢'
    },
    {
      roleName: 'Regional Operations Officer',
      badge: 'District / County',
      username: 'district.admin',
      password: 'District@123',
      description: 'Joint field surveys, title due-diligence verification & escrow payouts',
      icon: '📋'
    },
    {
      roleName: 'Project Agency EPC Lead',
      badge: 'Infrastructure Concessionaire',
      username: 'agency.user',
      password: 'Agency@123',
      description: 'Corridor alignment CAD uploads, project workspaces & milestone tracking',
      icon: '🏗️'
    }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['role']) {
        const persona = this.enterprisePersonas.find(p => p.username === params['role'] || p.roleName.toLowerCase().includes(params['role'].toLowerCase()));
        if (persona) {
          this.selectPersona(persona);
        }
      }
    });
  }

  selectPersona(persona: EnterprisePersona) {
    this.username = persona.username;
    this.password = persona.password;
    this.selectedPersona = persona.roleName;
    this.errorMessage = '';
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  onLogin() {
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Please enter your enterprise work email or corporate username.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.username.trim(), this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          const role = res.data.user.role;
          if (role === 'SuperAdmin') {
            this.router.navigate(['/admin/dashboard']);
          } else if (role === 'CentralAdmin') {
            this.router.navigate(['/central/dashboard']);
          } else if (role === 'StateAdmin') {
            this.router.navigate(['/state/dashboard']);
          } else if (role === 'DistrictAdmin') {
            this.router.navigate(['/district/dashboard']);
          } else if (role === 'ProjectAgency') {
            this.router.navigate(['/agency/dashboard']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.errorMessage = res.message || 'Authentication failed. Please verify your enterprise credentials.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Invalid enterprise credentials. Use a quick demo role persona below to test.';
      }
    });
  }
}

