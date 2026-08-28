import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { GovTopBarComponent } from '../../../../shared/components/gov-top-bar/gov-top-bar.component';
import { GovFooterComponent } from '../../../../shared/components/gov-footer/gov-footer.component';

export interface PortalRoleOption {
  code: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
  guidanceText: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule,
    GovTopBarComponent,
    GovFooterComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  // Form State
  username = '';
  password = '';
  showPassword = false;
  keepSignedIn = true;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Accessibility State
  currentFontSize: 'sm' | 'md' | 'lg' = 'md';
  currentLanguage: 'en' | 'hi' = 'en';

  // Interactive Portal Selector State
  selectedPortal: PortalRoleOption | null = null;

  portalRoles: PortalRoleOption[] = [
    {
      code: 'Citizen',
      name: 'Citizen / Landowner',
      badge: 'Public Portal',
      icon: '🌾',
      description: 'Track your land acquisition progress, notification status, compensation awards & PFMS DBT bank credits.',
      guidanceText: 'You are signing in to the Citizen & Landowner Portal. Use the credentials associated with your verified citizen account.'
    },
    {
      code: 'ProjectAgency',
      name: 'Project Implementing Agency',
      badge: 'NHAI / DFCCIL / Railways',
      icon: '🏗️',
      description: 'Submit linear infrastructure proposals, upload CAD/GIS corridor alignments & monitor clearance milestones.',
      guidanceText: 'You are signing in to the Implementing Agency Workspace. Enter your agency-authorized official credentials.'
    },
    {
      code: 'DistrictAdmin',
      name: 'District Administration',
      badge: 'District Collector / CALA',
      icon: '🏛️',
      description: 'Conduct joint field surveys, verify cadastral records, publish Section 11 notices & execute award declarations.',
      guidanceText: 'You are signing in to the District Collectorate / CALA Portal. Enter your district-assigned administrative account.'
    },
    {
      code: 'StateAdmin',
      name: 'State Revenue Authority',
      badge: 'State Govt Directorate',
      icon: '🏢',
      description: 'Multi-district proposal review, 3-tier state sanctions, revenue mutation oversight & fund allocation tracking.',
      guidanceText: 'You are signing in to the State Revenue & Approval Authority. Enter your state officer credentials.'
    },
    {
      code: 'CentralAdmin',
      name: 'Central Ministry Admin',
      badge: 'PM GatiShakti / MoRD / MoRTH',
      icon: '🇮🇳',
      description: 'Pan-India monitoring command center, cross-state corridor tracking, bottleneck resolution & macro analytics.',
      guidanceText: 'You are signing in to the Central Ministry Command Center. Enter your ministry-issued credentials.'
    }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['role']) {
        const portal = this.portalRoles.find(p => p.code.toLowerCase() === params['role'].toLowerCase() || p.name.toLowerCase().includes(params['role'].toLowerCase()));
        if (portal) {
          this.selectPortal(portal);
        }
      }
    });
  }

  selectPortal(portal: PortalRoleOption) {
    if (this.selectedPortal?.code === portal.code) {
      // Toggle unselect
      this.selectedPortal = null;
    } else {
      this.selectedPortal = portal;
    }
    this.errorMessage = '';
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  onFontSizeChange(size: 'sm' | 'md' | 'lg') {
    this.currentFontSize = size;
  }

  onLanguageChange(lang: 'en' | 'hi') {
    this.currentLanguage = lang;
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  onLogin() {
    const trimmedUsername = this.username.trim();
    if (!trimmedUsername || !this.password) {
      this.errorMessage = 'Please enter both your registered username/email and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(trimmedUsername, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.data) {
          const role = res.data.user.role;
          this.navigateByRole(role);
        } else {
          this.errorMessage = res.message || 'Invalid username or password.';
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 0) {
          this.errorMessage = 'Unable to connect to the BhoomiSetu portal service. Please verify your network connection.';
        } else if (err.status >= 500) {
          this.errorMessage = 'The portal could not complete your sign-in request. Please try again later.';
        } else {
          this.errorMessage = err.error?.message || 'Invalid username or password.';
        }
      }
    });
  }

  private navigateByRole(role: string) {
    switch (role) {
      case 'SuperAdmin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'CentralAdmin':
        this.router.navigate(['/central/dashboard']);
        break;
      case 'StateAdmin':
        this.router.navigate(['/state/dashboard']);
        break;
      case 'DistrictAdmin':
        this.router.navigate(['/district/dashboard']);
        break;
      case 'ProjectAgency':
        this.router.navigate(['/agency/dashboard']);
        break;
      case 'Citizen':
      default:
        this.router.navigate(['/dashboard']);
        break;
    }
  }
}
