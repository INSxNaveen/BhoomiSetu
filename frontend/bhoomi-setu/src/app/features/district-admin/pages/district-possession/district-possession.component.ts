import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { DistrictAdminService, DistrictPossessionSummary, DistrictPossessionItem } from '../../services/district-admin.service';

@Component({
  selector: 'app-district-possession',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent],
  templateUrl: './district-possession.component.html',
  styleUrl: './district-possession.component.scss'
})
export class DistrictPossessionComponent implements OnInit {
  private districtService = inject(DistrictAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  summary = signal<DistrictPossessionSummary | null>(null);
  successMessage = signal<string | null>(null);

  selectedStatus = '';
  searchQuery = '';

  selectedRecord: DistrictPossessionItem | null = null;
  showPossessionModal = false;
  possessionComments = '';
  actionLoading = false;
  actionError: string | null = null;

  ngOnInit(): void {
    this.loadPossession();
  }

  loadPossession(): void {
    this.loading.set(true);
    this.error.set(null);

    this.districtService.getPossession().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.summary.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load possession records.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading possession records.');
      }
    });
  }

  getFilteredRecords() {
    if (!this.summary()) return [];
    let list = this.summary()!.records;
    if (this.selectedStatus) {
      list = list.filter(r => r.possessionStatus === this.selectedStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(r =>
        r.surveyNumber.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        r.projectName.toLowerCase().includes(q) ||
        r.villageName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  openTakePossession(r: DistrictPossessionItem): void {
    this.selectedRecord = r;
    this.possessionComments = 'Physical possession taken under Section 38 of RFCTLARR Act 2013; revenue mutation Panchnama executed on site.';
    this.actionError = null;
    this.showPossessionModal = true;
  }

  closeModal(): void {
    this.showPossessionModal = false;
    this.selectedRecord = null;
    this.actionError = null;
  }

  confirmPossession(): void {
    if (!this.selectedRecord) return;
    this.actionLoading = true;
    this.actionError = null;

    this.districtService.takePossession(this.selectedRecord.parcelId, this.possessionComments).subscribe({
      next: (res) => {
        this.actionLoading = false;
        if (res.success) {
          this.closeModal();
          this.successMessage.set(`Physical possession successfully recorded for Survey No. ${this.selectedRecord?.surveyNumber}. Revenue record mutated.`);
          this.loadPossession();
          setTimeout(() => this.successMessage.set(null), 5000);
        } else {
          this.actionError = res.message || 'Failed to record possession.';
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Server error recording possession.';
      }
    });
  }
}
