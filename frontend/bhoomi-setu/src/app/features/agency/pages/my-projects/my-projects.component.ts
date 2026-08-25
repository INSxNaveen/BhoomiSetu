import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AgencyService, AgencyProjectSummary } from '../../services/agency.service';

@Component({
  selector: 'app-my-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-projects.component.html',
  styleUrl: './my-projects.component.scss'
})
export class MyProjectsComponent implements OnInit {
  private agencyService = inject(AgencyService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  projects = signal<AgencyProjectSummary[]>([]);

  searchQuery = '';
  selectedType = '';
  selectedStatus = '';

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.error.set(null);

    this.agencyService.getProjects().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.projects.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load projects.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading projects.');
      }
    });
  }

  getFilteredProjects(): AgencyProjectSummary[] {
    let list = this.projects();
    if (this.selectedType) {
      list = list.filter(p => p.projectType === this.selectedType);
    }
    if (this.selectedStatus) {
      list = list.filter(p => p.status === this.selectedStatus);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.projectName.toLowerCase().includes(q) ||
        p.projectCode.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
      );
    }
    return list;
  }
}
