import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DistrictAdminService } from '../../services/district-admin.service';

@Component({
  selector: 'app-district-projects',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './district-projects.component.html',
  styleUrl: './district-projects.component.scss'
})
export class DistrictProjectsComponent implements OnInit {
  private districtService = inject(DistrictAdminService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  projects = signal<any[]>([]);

  selectedStatus = '';
  selectedProjectType = '';
  searchQuery = '';

  selectedProject: any | null = null;
  showDetailModal = false;

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.error.set(null);

    this.districtService.getProjects(
      this.selectedStatus || undefined,
      this.selectedProjectType || undefined,
      this.searchQuery || undefined
    ).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.projects.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load district projects.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Server error loading projects.');
      }
    });
  }

  onFilterChange(): void {
    this.loadProjects();
  }

  openProjectDetail(p: any): void {
    this.selectedProject = p;
    this.showDetailModal = true;
  }

  closeModal(): void {
    this.showDetailModal = false;
    this.selectedProject = null;
  }

  formatCurrency(value: number): string {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(2)} Lakh`;
    }
    return `₹${value.toLocaleString('en-IN')}`;
  }
}
