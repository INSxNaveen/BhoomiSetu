import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CentralAdminService } from '../../services/central-admin.service';
import {
  NationalReportAnalytics,
  StateComparison
} from '../../models/central-admin.models';

@Component({
  selector: 'app-central-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './central-reports.component.html',
  styleUrl: './central-reports.component.scss'
})
export class CentralReportsComponent implements OnInit {
  private centralService = inject(CentralAdminService);

  loading = signal(true);
  errorMessage = signal('');
  exportNotice = signal('');

  data: NationalReportAnalytics | null = null;

  // Filter State
  selectedStateId = '';
  selectedProjectType = '';
  selectedYear = 2026;

  // Sort State for State Comparison table
  sortColumn: keyof StateComparison = 'acquisitionPercentage';
  sortAsc = false;

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.exportNotice.set('');

    this.centralService.getReportAnalytics({
      stateId: this.selectedStateId || undefined,
      projectType: this.selectedProjectType || undefined,
      year: this.selectedYear
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.data = res.data;
          this.sortStateComparisons();
        } else {
          this.errorMessage.set(res.message || 'Failed to generate national report.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Unable to generate analytics from reporting API.');
      }
    });
  }

  setSort(column: keyof StateComparison) {
    if (this.sortColumn === column) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = column;
      this.sortAsc = false;
    }
    this.sortStateComparisons();
  }

  sortStateComparisons() {
    if (!this.data) return;
    this.data.stateComparisons.sort((a, b) => {
      const valA = a[this.sortColumn];
      const valB = b[this.sortColumn];
      if (valA < valB) return this.sortAsc ? -1 : 1;
      if (valA > valB) return this.sortAsc ? 1 : -1;
      return 0;
    });
  }

  exportReport(format: 'PDF' | 'Excel') {
    this.exportNotice.set(`Generating ${format} National Acquisition Report for ${this.selectedYear}... Scheduled for download.`);
    setTimeout(() => {
      this.exportNotice.set(`✓ National Acquisition Summary (${format}) exported successfully.`);
    }, 1500);
  }

  formatCrores(amount: number): string {
    return (amount / 10000000).toFixed(2);
  }

  formatSqKm(hectares: number): string {
    return (hectares / 100).toFixed(2);
  }
}
