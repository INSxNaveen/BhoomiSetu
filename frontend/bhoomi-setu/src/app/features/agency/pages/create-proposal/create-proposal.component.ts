import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgencyService, AgencyProposalCreationRequest, AgencyDocumentSubmission } from '../../services/agency.service';

export interface StateOption {
  id: string;
  name: string;
  code: string;
  districts: { id: string; name: string; code: string }[];
}

@Component({
  selector: 'app-create-proposal',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './create-proposal.component.html',
  styleUrl: './create-proposal.component.scss'
})
export class CreateProposalComponent implements OnInit {
  private agencyService = inject(AgencyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentStep = 1;
  loading = signal<boolean>(false);
  geographyLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // States & Districts
  states: StateOption[] = [];
  filteredDistricts: { id: string; name: string; code: string }[] = [];

  // Form Model
  proposalId: string | null = null;
  isNewProject = true;

  // Step 1: Project Details
  projectName = '';
  projectCode = '';
  projectType = 0; // 0 = NationalHighway, 1 = RailwayLine, 2 = Airport, 3 = IndustrialCorridor, etc.
  selectedStateId = '';
  selectedDistrictId = '';
  estimatedCost: number = 250000000;
  description = '';
  startDate: string = '';
  targetCompletionDate: string = '';

  // Step 2: Land Requirement
  landAreaProposed: number = 45.0;
  tehsilName = 'Meerut Sadar';
  villageName = 'Dabathwa';
  surveyNumbers = '245/1A, 245/1B, 246/2, 248/4';
  landCategory = 'Agricultural (Single/Double Crop)';

  // Step 3: Affected Families
  affectedFamilyCount: number = 28;
  displacedFamilyCount: number = 8;
  rehabEligibleCount: number = 8;
  estimatedCompensation: number = 95000000;

  // Step 4: Documents
  documents: AgencyDocumentSubmission[] = [
    { documentType: 0, fileName: 'Detailed_Project_Report_DPR.pdf', storagePath: '/docs/dpr.pdf', fileSize: 8540000, remarks: 'Prepared by Technical Advisory Consultant' },
    { documentType: 1, fileName: 'Khasra_Cadastral_Land_Schedule.pdf', storagePath: '/docs/schedule.pdf', fileSize: 4210000, remarks: 'Revenue Survey Schedule' },
    { documentType: 9, fileName: 'Social_Impact_Assessment_SIA_Draft.pdf', storagePath: '/docs/sia.pdf', fileSize: 3100000, remarks: 'Draft SIA scheme' }
  ];

  newDocType = 0;
  newDocFileName = '';
  newDocRemarks = '';

  // Step 5: Modal & Submit state
  showConfirmSubmitModal = false;
  actionSubmitting = false;

  ngOnInit(): void {
    this.loadGeography();
    this.checkResumeDraft();
  }

  loadGeography(): void {
    this.geographyLoading.set(true);
    this.agencyService.getGeography().subscribe({
      next: (res) => {
        this.geographyLoading.set(false);
        if (res.success && res.data) {
          this.states = res.data;
          if (this.states.length > 0 && !this.selectedStateId) {
            this.selectedStateId = this.states[0].id;
            this.onStateChange();
          }
        }
      },
      error: () => {
        this.geographyLoading.set(false);
      }
    });
  }

  onStateChange(): void {
    const st = this.states.find(s => s.id === this.selectedStateId);
    this.filteredDistricts = st ? st.districts : [];
    if (this.filteredDistricts.length > 0) {
      this.selectedDistrictId = this.filteredDistricts[0].id;
    } else {
      this.selectedDistrictId = '';
    }
  }

  checkResumeDraft(): void {
    const draftId = this.route.snapshot.queryParamMap.get('draftId');
    if (draftId) {
      this.proposalId = draftId;
      this.loading.set(true);
      this.agencyService.getProposalById(draftId).subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res.success && res.data) {
            const p = res.data;
            this.projectName = p.projectName;
            this.projectCode = p.projectCode;
            this.landAreaProposed = p.landAreaProposed;
            this.affectedFamilyCount = p.affectedFamilyCount;
            this.estimatedCompensation = p.estimatedCompensation;
            this.successMessage.set(`Resumed draft proposal: ${p.proposalNumber}`);
          }
        },
        error: () => this.loading.set(false)
      });
    }
  }

  goToStep(step: number): void {
    if (step > this.currentStep && !this.validateCurrentStep()) {
      return;
    }
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextStep(): void {
    if (this.validateCurrentStep()) {
      this.currentStep = Math.min(5, this.currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevStep(): void {
    this.currentStep = Math.max(1, this.currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  validateCurrentStep(): boolean {
    this.error.set(null);
    if (this.currentStep === 1) {
      if (!this.projectName.trim()) {
        this.error.set('Project Name is required.');
        return false;
      }
      if (!this.selectedStateId || !this.selectedDistrictId) {
        this.error.set('Please select State and District jurisdiction.');
        return false;
      }
      if (this.estimatedCost <= 0) {
        this.error.set('Please enter a valid estimated project cost.');
        return false;
      }
    } else if (this.currentStep === 2) {
      if (this.landAreaProposed <= 0) {
        this.error.set('Proposed Land Area must be greater than 0 Hectares.');
        return false;
      }
      if (!this.surveyNumbers.trim()) {
        this.error.set('Please enter Survey/Khasra numbers.');
        return false;
      }
    } else if (this.currentStep === 3) {
      if (this.affectedFamilyCount < 0) {
        this.error.set('Affected Family Count cannot be negative.');
        return false;
      }
    }
    return true;
  }

  addDocument(): void {
    if (!this.newDocFileName.trim()) return;
    this.documents.push({
      documentType: Number(this.newDocType),
      fileName: this.newDocFileName.trim(),
      storagePath: `/documents/proposals/upload/${this.newDocFileName.trim()}`,
      fileSize: 2048000,
      remarks: this.newDocRemarks.trim() || 'Attached supporting document'
    });
    this.newDocFileName = '';
    this.newDocRemarks = '';
  }

  removeDocument(index: number): void {
    this.documents.splice(index, 1);
  }

  buildPayload(isDraft: boolean): AgencyProposalCreationRequest {
    return {
      projectId: this.proposalId ? undefined : undefined,
      isNewProject: this.isNewProject,
      projectName: this.projectName.trim() || 'New Infrastructure Acquisition Project',
      projectCode: this.projectCode.trim(),
      projectType: Number(this.projectType),
      stateId: this.selectedStateId,
      districtId: this.selectedDistrictId,
      description: this.description.trim() || `Land acquisition proposal for ${this.projectName}`,
      estimatedCost: this.estimatedCost,
      startDate: this.startDate ? this.startDate : undefined,
      targetCompletionDate: this.targetCompletionDate ? this.targetCompletionDate : undefined,
      landAreaProposed: this.landAreaProposed,
      tehsilName: this.tehsilName,
      villageName: this.villageName,
      surveyNumbers: this.surveyNumbers,
      landCategory: this.landCategory,
      affectedFamilyCount: this.affectedFamilyCount,
      displacedFamilyCount: this.displacedFamilyCount,
      rehabEligibleCount: this.rehabEligibleCount,
      estimatedCompensation: this.estimatedCompensation,
      isDraft: isDraft,
      documents: this.documents
    };
  }

  saveDraft(): void {
    this.actionSubmitting = true;
    this.error.set(null);
    const payload = this.buildPayload(true);

    if (this.proposalId) {
      this.agencyService.updateProposalDraft(this.proposalId, payload).subscribe({
        next: (res) => {
          this.actionSubmitting = false;
          if (res.success) {
            this.successMessage.set('Draft updated and saved successfully in database.');
            setTimeout(() => this.successMessage.set(null), 5000);
          } else {
            this.error.set(res.message || 'Failed to update draft.');
          }
        },
        error: (err) => {
          this.actionSubmitting = false;
          this.error.set(err.error?.message || 'Server error saving draft.');
        }
      });
    } else {
      this.agencyService.createProposal(payload).subscribe({
        next: (res) => {
          this.actionSubmitting = false;
          if (res.success && res.data) {
            this.proposalId = res.data.id;
            this.successMessage.set(`Proposal draft ${res.data.proposalNumber} saved successfully.`);
            setTimeout(() => this.successMessage.set(null), 5000);
          } else {
            this.error.set(res.message || 'Failed to save draft.');
          }
        },
        error: (err) => {
          this.actionSubmitting = false;
          this.error.set(err.error?.message || 'Server error saving draft.');
        }
      });
    }
  }

  openSubmitConfirmation(): void {
    if (!this.validateCurrentStep()) return;
    this.showConfirmSubmitModal = true;
  }

  closeModal(): void {
    this.showConfirmSubmitModal = false;
  }

  confirmSubmitProposal(): void {
    this.actionSubmitting = true;
    this.error.set(null);

    const payload = this.buildPayload(false);

    if (this.proposalId) {
      this.agencyService.submitProposal(this.proposalId).subscribe({
        next: (res) => {
          this.actionSubmitting = false;
          this.closeModal();
          if (res.success) {
            this.router.navigate(['/agency/tracking']);
          } else {
            this.error.set(res.message || 'Failed to submit proposal.');
          }
        },
        error: (err) => {
          this.actionSubmitting = false;
          this.closeModal();
          this.error.set(err.error?.message || 'Server error submitting proposal.');
        }
      });
    } else {
      this.agencyService.createProposal(payload).subscribe({
        next: (res) => {
          this.actionSubmitting = false;
          this.closeModal();
          if (res.success) {
            this.router.navigate(['/agency/tracking']);
          } else {
            this.error.set(res.message || 'Failed to submit proposal.');
          }
        },
        error: (err) => {
          this.actionSubmitting = false;
          this.closeModal();
          this.error.set(err.error?.message || 'Server error submitting proposal.');
        }
      });
    }
  }

  getStateName(): string {
    const st = this.states.find(s => s.id === this.selectedStateId);
    return st ? st.name : 'Not selected';
  }

  getDistrictName(): string {
    const dist = this.filteredDistricts.find(d => d.id === this.selectedDistrictId);
    return dist ? dist.name : 'Not selected';
  }

  getProjectTypeName(): string {
    const types = ['National Highway', 'Railway Line', 'Airport', 'Industrial Corridor', 'Urban Infrastructure', 'Irrigation', 'Power & Energy', 'Other'];
    return types[this.projectType] || 'Infrastructure';
  }

  formatCurrency(value: number): string {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
}
