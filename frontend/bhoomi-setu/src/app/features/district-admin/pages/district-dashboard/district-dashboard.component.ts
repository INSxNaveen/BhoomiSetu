import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DistrictAdminService, DistrictDashboardData } from '../../services/district-admin.service';

@Component({
  selector: 'app-district-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent],
  templateUrl: './district-dashboard.component.html',
  styleUrl: './district-dashboard.component.scss'
})
export class DistrictDashboardComponent implements OnInit {
  private districtService = inject(DistrictAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  data = signal<DistrictDashboardData | null>(null);

  selectedTehsil = '';
  selectedProjectType = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    this.districtService.getDashboard(
      this.selectedTehsil || undefined,
      this.selectedProjectType || undefined
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.data.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load district dashboard data.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading district dashboard.');
      }
    });
  }

  onFilterChange(): void {
    this.loadDashboard();
  }

  formatCurrency(value: number): string {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} Lakh`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  }
}
