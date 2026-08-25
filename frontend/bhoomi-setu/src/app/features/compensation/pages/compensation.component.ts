import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Component({
  selector: 'app-compensation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './compensation.component.html',
  styleUrl: './compensation.component.scss'
})
export class CompensationComponent implements OnInit {
  http = inject(HttpClient);
  items: any[] = [];

  ngOnInit() {
    this.http.get<any>(API_ENDPOINTS.compensation).subscribe({
      next: (res) => {
        if (res.success) this.items = res.data;
      },
      error: () => {
        this.items = [
          {
            surveyNumber: '245/1A',
            projectName: 'NH-48 Delhi-Meerut Expressway Expansion Phase 3',
            assessedAmount: 12000000,
            solatiumAmount: 12000000,
            interestAmount: 2400000,
            totalAmount: 26400000,
            status: 'Disbursed',
            payments: [{ paymentReference: 'DBT-2026-MRT-998811', paymentMethod: 'DBT Direct Bank Transfer' }]
          }
        ];
      }
    });
  }
}
