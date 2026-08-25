import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgencyService, AgencyTrackingItem } from '../../services/agency.service';

@Component({
  selector: 'app-proposal-tracking',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './proposal-tracking.component.html',
  styleUrl: './proposal-tracking.component.scss'
})
export class ProposalTrackingComponent implements OnInit {
  private agencyService = inject(AgencyService);
  private route = inject(ActivatedRoute);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  proposals = signal<AgencyTrackingItem[]>([]);
  selectedProposal = signal<AgencyTrackingItem | null>(null);

  searchQuery = '';
  selectedStatus = '';

  ngOnInit(): void {
    this.loadTracking();
  }

  loadTracking(): void {
    this.loading.set(true);
    this.error.set(null);

    this.agencyService.getTrackingList().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.proposals.set(res.data);
          const initialId = this.route.snapshot.queryParamMap.get('proposalId');
          if (initialId) {
            const found = res.data.find(p => p.proposalId === initialId);
            if (found) this.selectProposal(found);
            else if (res.data.length > 0) this.selectProposal(res.data[0]);
          } else if (res.data.length > 0) {
            this.selectProposal(res.data[0]);
          }
        } else {
          this.error.set(res.message || 'Failed to load tracking data.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading tracking proposals.');
      }
    });
  }

  selectProposal(p: AgencyTrackingItem): void {
    this.selectedProposal.set(p);
  }

  getFilteredProposals(): AgencyTrackingItem[] {
    let list = this.proposals();
    if (this.selectedStatus) {
      list = list.filter(p => p.status === this.selectedStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.proposalNumber.toLowerCase().includes(q) ||
        p.projectName.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getStageBadgeClass(status: string): string {
    switch (status) {
      case 'Completed': return 'stage-completed';
      case 'Current': return 'stage-current';
      case 'Returned': return 'stage-returned';
      case 'Rejected': return 'stage-rejected';
      default: return 'stage-pending';
    }
  }
}
