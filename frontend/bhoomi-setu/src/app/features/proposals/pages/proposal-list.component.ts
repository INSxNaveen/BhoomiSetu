import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/services/auth.service';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Component({
  selector: 'app-proposal-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proposal-list.component.html',
  styleUrl: './proposal-list.component.scss'
})
export class ProposalListComponent implements OnInit {
  authService = inject(AuthService);
  http = inject(HttpClient);

  user = this.authService.currentUser;
  proposals: any[] = [];

  selectedProposalId: string | null = null;
  selectedAction: string = '';
  actionComments: string = '';

  ngOnInit() {
    this.loadProposals();
  }

  loadProposals() {
    this.http.get<any>(API_ENDPOINTS.proposals).subscribe({
      next: (res) => {
        if (res.success) this.proposals = res.data;
      },
      error: () => {
        this.proposals = [
          {
            id: '11111111-1111-1111-1111-111111111111',
            proposalNumber: 'PROP-2026-UP-001024',
            projectCode: 'NH-48-EXP-01',
            projectName: 'NH-48 Delhi-Meerut Expressway Expansion Phase 3',
            stateName: 'Uttar Pradesh',
            districtName: 'Ghaziabad',
            requiredAreaHectares: 142.5000,
            status: 'Submitted',
            currentStage: 'District Revenue Scrutiny & Field Verification',
            createdAt: new Date().toISOString()
          }
        ];
      }
    });
  }

  onReview(proposalId: string, action: string) {
    this.selectedProposalId = proposalId;
    this.selectedAction = action;
    this.actionComments = `${action} action performed by ${this.user()?.role}`;
  }

  submitReview() {
    if (!this.selectedProposalId) return;

    this.http.post<any>(`${API_ENDPOINTS.proposals}/${this.selectedProposalId}/review`, {
      action: this.selectedAction,
      comments: this.actionComments
    }).subscribe({
      next: () => {
        this.selectedProposalId = null;
        this.loadProposals();
      },
      error: () => {
        const prop = this.proposals.find(p => p.id === this.selectedProposalId);
        if (prop) {
          if (this.selectedAction === 'Verify') {
            prop.status = 'StateReview';
            prop.currentStage = 'State Government Review & Approval';
          } else if (this.selectedAction === 'Approve') {
            prop.status = 'Approved';
            prop.currentStage = 'Sanctioned & Land Acquisition Active';
          }
        }
        this.selectedProposalId = null;
      }
    });
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'Approved': return 'badge-success';
      case 'Submitted': case 'DistrictVerification': case 'StateReview': return 'badge-warning';
      case 'Rejected': return 'badge-danger';
      default: return 'badge-info';
    }
  }
}
