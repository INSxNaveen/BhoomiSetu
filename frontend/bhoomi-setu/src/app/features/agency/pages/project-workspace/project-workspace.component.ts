import { Component, OnInit, inject, signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';
import { AgencyService, AgencyProjectWorkspace } from '../../services/agency.service';

@Component({
  selector: 'app-project-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, StatCardComponent],
  templateUrl: './project-workspace.component.html',
  styleUrl: './project-workspace.component.scss'
})
export class ProjectWorkspaceComponent implements OnInit, AfterViewInit {
  private agencyService = inject(AgencyService);
  private route = inject(ActivatedRoute);

  projectId: string = '';
  activeTab: 'overview' | 'land' | 'documents' | 'compensation' | 'possession' | 'rehabilitation' | 'timeline' = 'overview';

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  workspace = signal<AgencyProjectWorkspace | null>(null);

  // Map state
  private map: L.Map | null = null;
  private geoJsonLayer: L.GeoJSON | null = null;
  showMapModal = false;

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('projectId') || '';
    if (this.projectId) {
      this.loadWorkspace();
    } else {
      this.error.set('No project ID provided in route.');
    }
  }

  ngAfterViewInit(): void {
    // Map initialisation handled when opening map tab/modal
  }

  loadWorkspace(): void {
    this.loading.set(true);
    this.error.set(null);

    this.agencyService.getProjectWorkspace(this.projectId).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.workspace.set(res.data);
        } else {
          this.error.set(res.message || 'Failed to load project workspace.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 403) {
          this.error.set('Security Violation: You do not have permission to access projects outside your organization scope.');
        } else {
          this.error.set(err.error?.message || 'Server error loading project workspace.');
        }
      }
    });
  }

  setTab(tab: 'overview' | 'land' | 'documents' | 'compensation' | 'possession' | 'rehabilitation' | 'timeline'): void {
    this.activeTab = tab;
    if (tab === 'land') {
      setTimeout(() => this.initLeafletMap(), 100);
    }
  }

  initLeafletMap(): void {
    const mapContainer = document.getElementById('project-land-map');
    if (!mapContainer) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const ws = this.workspace();
    let initialLat = 28.9845;
    let initialLng = 77.7064;

    if (ws && ws.landParcels && ws.landParcels.length > 0) {
      initialLat = ws.landParcels[0].latitude || initialLat;
      initialLng = ws.landParcels[0].longitude || initialLng;
    }

    this.map = L.map(mapContainer, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap | BhoomiSetu Spatial Cadastre'
    }).addTo(this.map);

    // Add Parcels
    if (ws && ws.landParcels) {
      const bounds = L.latLngBounds([]);

      ws.landParcels.forEach((p: any) => {
        if (p.geoJsonGeometry) {
          try {
            const geoObj = JSON.parse(p.geoJsonGeometry);
            const color = p.acquisitionStatus === 'PossessionTaken' ? '#10b981' : (p.acquisitionStatus === 'CompensationPaid' ? '#3b82f6' : '#f59e0b');
            const poly = L.geoJSON(geoObj, {
              style: {
                color: color,
                weight: 2,
                fillColor: color,
                fillOpacity: 0.35
              }
            }).addTo(this.map!);

            poly.bindPopup(`
              <div style="font-family:sans-serif; font-size:12px;">
                <strong style="color:#1d4ed8;">Survey No: ${p.surveyNumber}</strong><br/>
                Village: ${p.villageName} (${p.tehsilName})<br/>
                Area: ${p.areaHectares} Ha (${p.landType})<br/>
                Status: <strong>${p.acquisitionStatus}</strong>
              </div>
            `);

            bounds.extend(poly.getBounds());
          } catch (e) {
            console.error('GeoJSON parse error', e);
          }
        } else if (p.latitude && p.longitude) {
          const marker = L.circleMarker([p.latitude, p.longitude], {
            radius: 8,
            fillColor: '#3b82f6',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(this.map!);

          marker.bindPopup(`<strong>Survey No: ${p.surveyNumber}</strong><br/>Area: ${p.areaHectares} Ha`);
          bounds.extend([p.latitude, p.longitude]);
        }
      });

      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [30, 30] });
      }
    }

    setTimeout(() => this.map?.invalidateSize(), 200);
  }

  formatCurrency(value: number): string {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} Lakh`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
}
