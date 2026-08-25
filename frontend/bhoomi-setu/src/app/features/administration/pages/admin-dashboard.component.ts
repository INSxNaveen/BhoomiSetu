import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2>Super Admin System Console</h2>
      <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 16px;">
        User Management, RBAC Role Matrix, Organizations & System Health
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
        <div class="card" style="background: #f8fafc;">
          <h4>👥 Active Users</h4>
          <div style="font-size: 1.5rem; font-weight: 700;">5 Demo Users</div>
        </div>
        <div class="card" style="background: #f8fafc;">
          <h4>🔑 RBAC Roles</h4>
          <div style="font-size: 1.5rem; font-weight: 700;">5 Roles / 13 Permissions</div>
        </div>
        <div class="card" style="background: #f8fafc;">
          <h4>🏛️ Organizations</h4>
          <div style="font-size: 1.5rem; font-weight: 700;">4 Ministries & Agencies</div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {}

export const ADMINISTRATION_ROUTES: Routes = [
  { path: '', component: AdminDashboardComponent }
];
