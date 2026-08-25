import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Component({
  selector: 'app-rehabilitation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rehabilitation.component.html',
  styleUrl: './rehabilitation.component.scss'
})
export class RehabilitationComponent implements OnInit {
  http = inject(HttpClient);
  families: any[] = [];

  ngOnInit() {
    this.http.get<any>(API_ENDPOINTS.rehabilitation).subscribe({
      next: (res) => {
        if (res.success) this.families = res.data;
      },
      error: () => {
        this.families = [
          {
            familyReference: 'FAM-2026-001',
            headOfFamilyName: 'Ramesh Chand Tyagi',
            familySize: 6,
            isDisplaced: true,
            rehabilitationCase: {
              rehabilitationSite: 'Resettlement Colony Sector 4, Meerut',
              eligibleAmount: 500000,
              providedAmount: 500000,
              status: 'Completed'
            }
          }
        ];
      }
    });
  }
}
