import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DistrictAdminService, DistrictReportData } from '../../services/district-admin.service';

@Component({
  selector: 'app-district-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent],
  templateUrl: './district-reports.component.html',
  styleUrl: './district-reports.component.scss'
})
export class DistrictReportsComponent implements OnInit {
  private districtService = inject(DistrictAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  report = signal<DistrictReportData | null>(null);
  exportMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.error.set(null);

    this.districtService.getReports().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.report.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load district reports.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error generating reports.');
      }
    });
  }

  exportCsv(): void {
    if (!this.report()) return;
    const r = this.report()!;
    let csv = `BhoomiSetu District Acquisition Report - ${r.districtName} (${r.stateName})\n`;
    csv += `Generated At,${r.generatedAt}\n\n`;
    csv += `Tehsil,Parcels,Land Area (Ha),Verified,Compensation Disbursed (INR),Status\n`;
    r.tehsilProgress.forEach(t => {
      csv += `"${t.tehsilName}",${t.parcelsCount},${t.landAreaHectares},${t.verifiedCount},${t.compensationDisbursed},"${t.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BhoomiSetu_${r.districtName}_Report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.exportMessage.set('District summary CSV generated and downloaded successfully.');
    setTimeout(() => this.exportMessage.set(null), 5000);
  }

  formatCurrency(value: number): string {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
}
