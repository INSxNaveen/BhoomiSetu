import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  http = inject(HttpClient);
  projects: any[] = [];

  ngOnInit() {
    this.http.get<any>(API_ENDPOINTS.projects).subscribe({
      next: (res) => {
        if (res.success) this.projects = res.data;
      },
      error: () => {
        this.projects = [
          {
            projectCode: 'NH-48-EXP-01',
            name: 'NH-48 Delhi-Meerut Expressway Expansion Phase 3',
            description: 'Widening and construction of 6-lane access-controlled expressway bypass through Meerut district.',
            projectType: 'NationalHighway',
            stateName: 'Uttar Pradesh',
            districtName: 'Meerut',
            estimatedCost: 450000000,
            requiredAreaHectares: 124.5,
            status: 'AcquisitionInProgress'
          }
        ];
      }
    });
  }
}
