import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { AgencyService, AgencyDashboardData, AgencyProjectSummary } from '../../services/agency.service';

@Component({
  selector: 'app-agency-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent],
  templateUrl: './agency-dashboard.component.html',
  styleUrl: './agency-dashboard.component.scss'
})
export class AgencyDashboardComponent implements OnInit {
  private agencyService = inject(AgencyService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  dashboard = signal<AgencyDashboardData | null>(null);

  searchQuery = '';
  selectedStatus = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.agencyService.getDashboard().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.dashboard.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load agency dashboard.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading agency dashboard data.');
      }
    });
  }

  getFilteredProjects(): AgencyProjectSummary[] {
    if (!this.dashboard()) return [];
    let list = this.dashboard()!.projects;
    if (this.selectedStatus) {
      list = list.filter(p => p.status === this.selectedStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    }
    return list;
  }

  formatCurrency(value: number): string {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
}
