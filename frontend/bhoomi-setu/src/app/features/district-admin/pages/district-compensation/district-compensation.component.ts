import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DistrictAdminService, DistrictCompensationSummary } from '../../services/district-admin.service';

@Component({
  selector: 'app-district-compensation',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent],
  templateUrl: './district-compensation.component.html',
  styleUrl: './district-compensation.component.scss'
})
export class DistrictCompensationComponent implements OnInit {
  private districtService = inject(DistrictAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  summary = signal<DistrictCompensationSummary | null>(null);

  selectedStatus = '';
  searchQuery = '';

  ngOnInit(): void {
    this.loadCompensation();
  }

  loadCompensation(): void {
    this.loading.set(true);
    this.error.set(null);

    this.districtService.getCompensation().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.summary.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load compensation data.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading compensation records.');
      }
    });
  }

  getFilteredAssessments() {
    if (!this.summary()) return [];
    let list = this.summary()!.assessments;
    if (this.selectedStatus) {
      list = list.filter(a => a.status === this.selectedStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a =>
        a.surveyNumber.toLowerCase().includes(q) ||
        a.ownerName.toLowerCase().includes(q) ||
        a.villageName.toLowerCase().includes(q) ||
        a.projectName.toLowerCase().includes(q)
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
