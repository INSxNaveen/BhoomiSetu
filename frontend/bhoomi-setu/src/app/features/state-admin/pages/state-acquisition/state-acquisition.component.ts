import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StateAdminService, StateAcquisitionAnalytics } from '../../services/state-admin.service';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-state-acquisition',
  standalone: true,
  imports: [CommonModule, RouterModule, StatCardComponent],
  templateUrl: './state-acquisition.component.html',
  styleUrl: './state-acquisition.component.scss'
})
export class StateAcquisitionComponent implements OnInit {
  private stateAdminService = inject(StateAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  data = signal<StateAcquisitionAnalytics | null>(null);

  ngOnInit() {
    this.loadAcquisitionData();
  }

  loadAcquisitionData() {
    this.loading.set(true);
    this.error.set(null);

    this.stateAdminService.getAcquisitionAnalytics().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.data.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load acquisition analytics.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error communicating with state authority gateway.');
      }
    });
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
