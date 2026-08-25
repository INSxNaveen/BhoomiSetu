import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StateAdminService, StateDashboardData } from '../../services/state-admin.service';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-state-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent],
  templateUrl: './state-dashboard.component.html',
  styleUrl: './state-dashboard.component.scss'
})
export class StateDashboardComponent implements OnInit {
  private stateAdminService = inject(StateAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  data = signal<StateDashboardData | null>(null);

  selectedDistrict = '';
  selectedProjectType = '';

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);
    this.error.set(null);

    this.stateAdminService.getDashboard(this.selectedDistrict || undefined, this.selectedProjectType || undefined).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.data.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load state dashboard data.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error communicating with state authority gateway.');
      }
    });
  }

  onFilterChange() {
    this.loadDashboard();
  }

  formatCurrency(val: number): string {
    if (!val) return '₹0';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  }
}
