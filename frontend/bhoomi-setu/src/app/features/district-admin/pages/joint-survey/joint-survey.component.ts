import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DistrictAdminService, DistrictJointSurvey } from '../../services/district-admin.service';

@Component({
  selector: 'app-joint-survey',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './joint-survey.component.html',
  styleUrl: './joint-survey.component.scss'
})
export class JointSurveyComponent implements OnInit {
  private districtService = inject(DistrictAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  surveys = signal<DistrictJointSurvey[]>([]);
  successMessage = signal<string | null>(null);

  selectedStatus = '';
  searchQuery = '';

  selectedSurvey: DistrictJointSurvey | null = null;
  showStatusModal = false;
  surveyComments = '';
  actionLoading = false;
  actionError: string | null = null;

  ngOnInit(): void {
    this.loadSurveys();
  }

  loadSurveys(): void {
    this.loading.set(true);
    this.error.set(null);

    this.districtService.getSurveys().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          let list = res.data;
          if (this.selectedStatus) {
            list = list.filter(s => s.status === this.selectedStatus);
          }
          if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            list = list.filter(s => s.surveyNumber.toLowerCase().includes(q) || s.projectName.toLowerCase().includes(q) || s.villageName.toLowerCase().includes(q));
          }
          this.surveys.set(list);
        } else {
          this.error.set(res.message || 'Failed to load joint surveys.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading joint surveys.');
      }
    });
  }

  onFilterChange(): void {
    this.loadSurveys();
  }

  openStatusDialog(survey: DistrictJointSurvey): void {
    this.selectedSurvey = survey;
    this.surveyComments = 'Ground measurement completed with DGPS instruments; boundary pegs fixed with landholder witness.';
    this.actionError = null;
    this.showStatusModal = true;
  }

  closeModal(): void {
    this.showStatusModal = false;
    this.selectedSurvey = null;
    this.actionError = null;
  }

  confirmComplete(): void {
    if (!this.selectedSurvey) return;
    this.actionLoading = true;
    this.actionError = null;

    this.districtService.updateSurveyStatus(this.selectedSurvey.id, this.surveyComments).subscribe({
      next: (res) => {
        this.actionLoading = false;
        if (res.success) {
          this.closeModal();
          this.successMessage.set(`Joint Measurement Survey completed for Survey No. ${this.selectedSurvey?.surveyNumber}.`);
          this.loadSurveys();
          setTimeout(() => this.successMessage.set(null), 5000);
        } else {
          this.actionError = res.message || 'Failed to update survey.';
        }
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Server error updating survey.';
      }
    });
  }
}
