import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2>National Land Acquisition Analytics & Reports</h2>
      <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 16px;">
        Export MIS Reports in Excel / PDF for Ministry Oversight
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div class="card" style="background: #f8fafc;">
          <h4>📊 Monthly Acquisition Progress</h4>
          <p style="font-size: 0.75rem; color: #64748b; margin: 8px 0;">State-wise land acquisition targets vs achievements.</p>
          <button class="btn btn-outline btn-sm">Download PDF</button>
        </div>
        <div class="card" style="background: #f8fafc;">
          <h4>💰 Compensation Audit Report</h4>
          <p style="font-size: 0.75rem; color: #64748b; margin: 8px 0;">DBT payment disbursements and pending treasury claims.</p>
          <button class="btn btn-outline btn-sm">Export Excel</button>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent {}

export const REPORT_ROUTES: Routes = [
  { path: '', component: ReportsComponent }
];
