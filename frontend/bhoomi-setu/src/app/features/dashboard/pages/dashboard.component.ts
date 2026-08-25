import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/auth/services/auth.service';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  http = inject(HttpClient);

  user = this.authService.currentUser;
  summary: any = null;

  ngOnInit() {
    this.http.get<any>(API_ENDPOINTS.dashboard.summary).subscribe({
      next: (res) => {
        if (res.success) this.summary = res.data;
      },
      error: () => {
        this.summary = {
          totalProjects: 1,
          pendingProposals: 1,
          approvedProjects: 1,
          totalLandProposedHectares: 124.5,
          totalLandAcquiredHectares: 11.05,
          totalCompensationAssessedInr: 26400000,
          totalCompensationDisbursedInr: 26400000,
          totalAffectedFamilies: 42,
          completedPossessions: 1,
          completedRehabilitationCases: 1
        };
      }
    });
  }
}
