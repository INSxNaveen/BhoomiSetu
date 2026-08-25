import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { API_ENDPOINTS } from '../../../core/config/api.config';

@Component({
  selector: 'app-land-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './land-map.component.html',
  styleUrl: './land-map.component.scss'
})
export class LandMapComponent implements OnInit, AfterViewInit {
  http = inject(HttpClient);
  private map!: L.Map;

  ngOnInit() {}

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap() {
    this.map = L.map('leaflet-map').setView([28.9845, 77.7064], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors | BhoomiSetu Spatial Core'
    }).addTo(this.map);

    this.loadParcels();
  }

  private loadParcels() {
    this.http.get<any>(API_ENDPOINTS.gis.parcels).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.renderGeoJsonParcels(res.data);
        }
      },
      error: () => {
        const demoParcels = [
          {
            surveyNumber: '245/1A',
            parcelNumber: 'PARCEL-001',
            areaHectares: 4.25,
            acquisitionStatus: 'PossessionTaken',
            geoJsonGeometry: '{"type":"Polygon","coordinates":[[[77.705,28.983],[77.708,28.983],[77.708,28.986],[77.705,28.986],[77.705,28.983]]]}'
          },
          {
            surveyNumber: '112/3B',
            parcelNumber: 'PARCEL-002',
            areaHectares: 6.80,
            acquisitionStatus: 'CompensationPaid',
            geoJsonGeometry: '{"type":"Polygon","coordinates":[[[77.710,28.990],[77.715,28.990],[77.715,28.994],[77.710,28.994],[77.710,28.990]]]}'
          }
        ];
        this.renderGeoJsonParcels(demoParcels);
      }
    });
  }

  private renderGeoJsonParcels(parcels: any[]) {
    parcels.forEach(p => {
      try {
        const geoJson = JSON.parse(p.geoJsonGeometry);
        const color = p.acquisitionStatus === 'PossessionTaken' ? '#059669' : '#d97706';

        const layer = L.geoJSON(geoJson, {
          style: {
            color: color,
            weight: 2,
            fillColor: color,
            fillOpacity: 0.4
          }
        }).addTo(this.map);

        layer.bindPopup(`
          <div style="font-family: sans-serif;">
            <strong style="font-size: 14px;">Survey #${p.surveyNumber}</strong><br/>
            <span>Parcel ID: ${p.parcelNumber}</span><br/>
            <span>Area: ${p.areaHectares} Hectares</span><br/>
            <span>Status: <strong>${p.acquisitionStatus}</strong></span>
          </div>
        `);
      } catch (e) {
        console.error('Error rendering GeoJSON parcel', e);
      }
    });
  }
}
