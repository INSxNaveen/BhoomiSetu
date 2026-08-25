import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-agency-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agency-layout.component.html',
  styleUrl: './agency-layout.component.scss'
})
export class AgencyLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = true;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }

  getUserOrgName(): string {
    const user = this.authService.currentUser();
    return user?.organizationName || 'Project Implementing Agency';
  }

  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (!user) return 'Agency User';
    return `${user.firstName} ${user.lastName}`.trim() || user.username;
  }
}
