import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Routes } from '@angular/router';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Component({
  selector: 'app-parcel-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 1.5rem;">
      <h2 style="color: #f8fafc; margin-bottom: 1rem;">Land Cadastre & Khasra Parcels</h2>
      <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; color: #f8fafc; font-size: 0.875rem;">
          <thead>
            <tr style="background: rgba(0,0,0,0.3); text-align: left;">
              <th style="padding: 10px 14px;">Survey / Khasra No</th>
              <th style="padding: 10px 14px;">Parcel Code</th>
              <th style="padding: 10px 14px;">Project Name</th>
              <th style="padding: 10px 14px;">Village / District</th>
              <th style="padding: 10px 14px;">Area (Ha)</th>
              <th style="padding: 10px 14px;">Type</th>
              <th style="padding: 10px 14px;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of parcels" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 10px 14px; font-weight: 600; color: #60a5fa;">{{ p.surveyNumber }}</td>
              <td style="padding: 10px 14px;">{{ p.parcelNumber }}</td>
              <td style="padding: 10px 14px;">{{ p.projectName }}</td>
              <td style="padding: 10px 14px;">{{ p.villageName }}, {{ p.districtName }}</td>
              <td style="padding: 10px 14px;">{{ p.areaHectares }}</td>
              <td style="padding: 10px 14px;">{{ p.landType }}</td>
              <td style="padding: 10px 14px;"><span style="background: rgba(5,150,105,0.2); color: #34d399; padding: 2px 8px; border-radius: 4px;">{{ p.acquisitionStatus }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ParcelListComponent implements OnInit {
  http = inject(HttpClient);
  parcels: any[] = [];

  ngOnInit() {
    this.http.get<any>(API_ENDPOINTS.gis.parcels).subscribe({
      next: (res) => { if (res.success) this.parcels = res.data; },
      error: () => {
        this.parcels = [
          { surveyNumber: '245/1A', parcelNumber: 'PARCEL-001', projectName: 'NH-48 Expressway', villageName: 'Dabathwa', districtName: 'Meerut', areaHectares: 4.25, landType: 'Agricultural', acquisitionStatus: 'PossessionTaken' }
        ];
      }
    });
  }
}

export const PARCEL_ROUTES: Routes = [
  { path: '', component: ParcelListComponent }
];
