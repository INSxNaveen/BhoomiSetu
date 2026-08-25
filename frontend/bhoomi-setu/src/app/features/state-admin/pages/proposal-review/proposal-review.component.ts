import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StateAdminService, StateProposalItem, StateProposalDetail } from '../../services/state-admin.service';

@Component({
  selector: 'app-proposal-review',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './proposal-review.component.html',
  styleUrl: './proposal-review.component.scss'
})
export class ProposalReviewComponent implements OnInit {
  private stateAdminService = inject(StateAdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  proposals = signal<StateProposalItem[]>([]);
  
  // Inspection & Modals state
  selectedProposal = signal<StateProposalDetail | null>(null);
  detailLoading = signal<boolean>(false);
  activeTab: 'overview' | 'land' | 'documents' | 'families' | 'timeline' = 'overview';

  // Workflow Dialogs
  showApproveModal = false;
  showReturnModal = false;
  showRejectModal = false;
  workflowActionLoading = false;
  workflowComment = '';
  workflowReason = '';
  workflowError = '';
  successToast = '';

  // Filters
  searchQuery = '';
  selectedDistrict = '';
  selectedStatus = '';
  selectedProjectType = '';

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.openProposalDetail(params['id']);
      }
    });
    this.loadProposals();
  }

  loadProposals() {
    this.loading.set(true);
    this.error.set(null);

    this.stateAdminService.getProposals({
      districtId: this.selectedDistrict || undefined,
      status: this.selectedStatus || undefined,
      projectType: this.selectedProjectType || undefined,
      search: this.searchQuery || undefined
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.proposals.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load proposals.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error communicating with state authority gateway.');
      }
    });
  }

  openProposalDetail(id: string) {
    this.detailLoading.set(true);
    this.activeTab = 'overview';
    this.workflowError = '';

    this.stateAdminService.getProposalDetail(id).subscribe({
      next: (res) => {
        this.detailLoading.set(false);
        if (res.success && res.data) {
          this.selectedProposal.set(res.data);
        }
      },
      error: (err) => {
        this.detailLoading.set(false);
        this.workflowError = err.error?.message || 'Failed to load proposal details.';
      }
    });
  }

  closeDetail() {
    this.selectedProposal.set(null);
  }

  // Workflow Actions
  openApproveDialog() {
    this.workflowComment = '';
    this.workflowError = '';
    this.showApproveModal = true;
  }

  openReturnDialog() {
    this.workflowReason = '';
    this.workflowError = '';
    this.showReturnModal = true;
  }

  openRejectDialog() {
    this.workflowReason = '';
    this.workflowError = '';
    this.showRejectModal = true;
  }

  submitApprove() {
    const proposal = this.selectedProposal();
    if (!proposal) return;

    this.workflowActionLoading = true;
    this.workflowError = '';

    this.stateAdminService.approveProposal(proposal.id, this.workflowComment).subscribe({
      next: (res) => {
        this.workflowActionLoading = false;
        if (res.success) {
          this.showApproveModal = false;
          this.showToast(`Proposal ${proposal.proposalNumber} approved successfully!`);
          this.openProposalDetail(proposal.id);
          this.loadProposals();
        } else {
          this.workflowError = res.message || 'Failed to approve proposal.';
        }
      },
      error: (err) => {
        this.workflowActionLoading = false;
        this.workflowError = err.error?.message || 'Approval failed. Please check state workflow constraints.';
      }
    });
  }

  submitReturn() {
    const proposal = this.selectedProposal();
    if (!proposal) return;

    if (!this.workflowReason.trim()) {
      this.workflowError = 'Please enter the specific reason / clarifications required.';
      return;
    }

    this.workflowActionLoading = true;
    this.workflowError = '';

    this.stateAdminService.returnProposal(proposal.id, this.workflowReason.trim()).subscribe({
      next: (res) => {
        this.workflowActionLoading = false;
        if (res.success) {
          this.showReturnModal = false;
          this.showToast(`Proposal ${proposal.proposalNumber} returned to District/Agency.`);
          this.openProposalDetail(proposal.id);
          this.loadProposals();
        } else {
          this.workflowError = res.message || 'Failed to return proposal.';
        }
      },
      error: (err) => {
        this.workflowActionLoading = false;
        this.workflowError = err.error?.message || 'Return failed.';
      }
    });
  }

  submitReject() {
    const proposal = this.selectedProposal();
    if (!proposal) return;

    if (!this.workflowReason.trim()) {
      this.workflowError = 'Please state the statutory / environmental reason for rejection.';
      return;
    }

    this.workflowActionLoading = true;
    this.workflowError = '';

    this.stateAdminService.rejectProposal(proposal.id, this.workflowReason.trim()).subscribe({
      next: (res) => {
        this.workflowActionLoading = false;
        if (res.success) {
          this.showRejectModal = false;
          this.showToast(`Proposal ${proposal.proposalNumber} marked as Rejected.`);
          this.openProposalDetail(proposal.id);
          this.loadProposals();
        } else {
          this.workflowError = res.message || 'Failed to reject proposal.';
        }
      },
      error: (err) => {
        this.workflowActionLoading = false;
        this.workflowError = err.error?.message || 'Rejection failed.';
      }
    });
  }

  showToast(msg: string) {
    this.successToast = msg;
    setTimeout(() => {
      this.successToast = '';
    }, 4500);
  }

  navigateToGis(projectId: string) {
    this.router.navigate(['/state/projects'], { queryParams: { projectId } });
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
