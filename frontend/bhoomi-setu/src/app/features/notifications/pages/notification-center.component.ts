import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2>Notification Center</h2>
      <p style="color: var(--color-text-muted); font-size: 0.875rem; margin-bottom: 16px;">
        Workflow Alerts & Administrative Reminders
      </p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div class="card" style="border-left: 4px solid #059669; padding: 12px;">
          <strong>Proposal Approved</strong> - PROP-2026-UP-001024 approved by State Government.
        </div>
        <div class="card" style="border-left: 4px solid #d97706; padding: 12px;">
          <strong>Field Verification Request</strong> - District Collectorate assigned for survey verification.
        </div>
      </div>
    </div>
  `
})
export class NotificationCenterComponent {}

export const NOTIFICATION_ROUTES: Routes = [
  { path: '', component: NotificationCenterComponent }
];
