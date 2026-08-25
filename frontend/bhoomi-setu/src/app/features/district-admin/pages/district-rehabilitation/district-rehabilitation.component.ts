import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DistrictAdminService, DistrictRehabilitationSummary, DistrictRehabilitationItem } from '../../services/district-admin.service';

@Component({
  selector: 'app-district-rehabilitation',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent],
  templateUrl: './district-rehabilitation.component.html',
  styleUrl: './district-rehabilitation.component.scss'
})
export class DistrictRehabilitationComponent implements OnInit {
  private districtService = inject(DistrictAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  summary = signal<DistrictRehabilitationSummary | null>(null);

  selectedStatus = '';
  searchQuery = '';

  ngOnInit(): void {
    this.loadRehabilitation();
  }

  loadRehabilitation(): void {
    this.loading.set(true);
    this.error.set(null);

    this.districtService.getRehabilitation().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.summary.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load R&R data.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading R&R records.');
      }
    });
  }

  getFilteredCases() {
    if (!this.summary()) return [];
    let list = this.summary()!.cases;
    if (this.selectedStatus) {
      list = list.filter(c => c.status === this.selectedStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(c =>
        c.headOfFamilyName.toLowerCase().includes(q) ||
        c.familyReference.toLowerCase().includes(q) ||
        c.villageName.toLowerCase().includes(q) ||
        c.rehabilitationSite.toLowerCase().includes(q)
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
