import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="getBadgeClass()">{{ status }}</span>`,
  styles: [`
    .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .badge-success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
    .badge-warning { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
    .badge-danger { background: #fff1f2; color: #e11d48; border: 1px solid #fecdd3; }
    .badge-info { background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; }
  `]
})
export class StatusBadgeComponent {
  @Input() status: string = 'Pending';

  getBadgeClass(): string {
    switch (this.status) {
      case 'Approved': case 'Completed': case 'PossessionTaken': return 'badge-success';
      case 'Submitted': case 'DistrictVerification': case 'StateReview': case 'Pending': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      default: return 'badge-info';
    }
  }
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="title">{{ title }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .title { font-size: 1.5rem; font-weight: 700; color: var(--color-navy-900); }
    .subtitle { font-size: 0.875rem; color: var(--color-text-muted); }
  `]
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
}

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="spinner-overlay"><div class="spinner"></div></div>`,
  styles: [`
    .spinner-overlay { display: flex; justify-content: center; padding: 24px; }
    .spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="icon">📁</div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
    </div>
  `,
  styles: [`
    .empty-state { text-align: center; padding: 40px; color: var(--color-text-muted); }
    .icon { font-size: 3rem; margin-bottom: 8px; }
  `]
})
export class EmptyStateComponent {
  @Input() title: string = 'No Data Found';
  @Input() message: string = 'There are no records to display at this time.';
}
