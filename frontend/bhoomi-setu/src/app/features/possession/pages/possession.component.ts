import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Component({
  selector: 'app-possession',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './possession.component.html',
  styleUrl: './possession.component.scss'
})
export class PossessionComponent implements OnInit {
  http = inject(HttpClient);
  records: any[] = [];

  ngOnInit() {
    this.http.get<any>(API_ENDPOINTS.possession).subscribe({
      next: (res) => {
        if (res.success) this.records = res.data;
      },
      error: () => {
        this.records = [
          {
            surveyNumber: '245/1A',
            projectName: 'NH-48 Delhi-Meerut Expressway Expansion Phase 3',
            areaHectares: 4.25,
            possessionDate: '2026-08-09T00:00:00Z',
            verifiedByName: 'Amit Verma',
            remarks: 'Physical possession taken and revenue map updated.',
            status: 'PossessionTaken'
          }
        ];
      }
    });
  }
}
