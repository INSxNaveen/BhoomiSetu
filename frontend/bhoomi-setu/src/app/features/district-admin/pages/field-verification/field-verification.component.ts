import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DistrictAdminService, DistrictVerificationItem } from '../../services/district-admin.service';

@Component({
  selector: 'app-field-verification',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './field-verification.component.html',
  styleUrl: './field-verification.component.scss'
})
export class FieldVerificationComponent implements OnInit {
  private districtService = inject(DistrictAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  verifications = signal<DistrictVerificationItem[]>([]);
  successMessage = signal<string | null>(null);

  selectedStatus = '';
  searchQuery = '';

  // Inspection Modal
  selectedItem: DistrictVerificationItem | null = null;
  showDetailModal = false;

  // Action Dialogs
  showVerifyModal = false;
  verifyComments = '';
  actionLoading = false;
  actionError: string | null = null;

  showReturnModal = false;
  returnReason = '';

  ngOnInit(): void {
    this.loadVerifications();
  }

  loadVerifications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.districtService.getVerifications(
      this.selectedStatus || undefined,
      this.searchQuery || undefined
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.verifications.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load field verifications.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading field verifications.');
      }
    });
  }

  onFilterChange(): void {
    this.loadVerifications();
  }

  openInspect(item: DistrictVerificationItem): void {
    this.selectedItem = item;
    this.showDetailModal = true;
  }

  closeModal(): void {
    this.showDetailModal = false;
    this.selectedItem = null;
    this.showVerifyModal = false;
    this.showReturnModal = false;
    this.actionError = null;
  }

  openVerifyDialog(item: DistrictVerificationItem): void {
    this.selectedItem = item;
    this.verifyComments = 'Ground measurement, boundary pegs, and landowner khasra entries verified on site by CALA team.';
    this.actionError = null;
    this.showVerifyModal = true;
  }

  openReturnDialog(item: DistrictVerificationItem): void {
    this.selectedItem = item;
    this.returnReason = '';
    this.actionError = null;
    this.showReturnModal = true;
  }

  confirmVerify(): void {
    if (!this.selectedItem) return;
    this.actionLoading = true;
    this.actionError = null;

    this.districtService.verifyFieldParcel(this.selectedItem.id, this.verifyComments).subscribe({
      next: (res) => {
        this.actionLoading = false;
        if (res.success) {
          this.closeModal();
          this.successMessage.set(`Survey verification completed for Survey No. ${this.selectedItem?.surveyNumber}. Status updated to Surveyed.`);
          this.loadVerifications();
          setTimeout(() => this.successMessage.set(null), 5000);
        } else {
          this.actionError = res.message || 'Failed to complete verification.';
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Server error processing verification.';
      }
    });
  }

  confirmReturn(): void {
    if (!this.selectedItem) return;
    if (!this.returnReason.trim()) {
      this.actionError = 'Please state the mandatory reason/discrepancy for returning this record.';
      return;
    }

    this.actionLoading = true;
    this.actionError = null;

    this.districtService.returnFieldVerification(this.selectedItem.id, this.returnReason.trim()).subscribe({
      next: (res) => {
        this.actionLoading = false;
        if (res.success) {
          this.closeModal();
          this.successMessage.set(`Record returned to Agency with discrepancy notes.`);
          this.loadVerifications();
          setTimeout(() => this.successMessage.set(null), 5000);
        } else {
          this.actionError = res.message || 'Failed to return record.';
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Server error returning record.';
      }
    });
  }
}
