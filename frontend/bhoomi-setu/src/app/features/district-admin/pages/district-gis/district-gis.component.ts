import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DistrictAdminService } from '../../services/district-admin.service';

import * as L from 'leaflet';

@Component({
  selector: 'app-district-gis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './district-gis.component.html',
  styleUrl: './district-gis.component.scss'
})
export class DistrictGisComponent implements OnInit, OnDestroy {
  private districtService = inject(DistrictAdminService);
  private route = inject(ActivatedRoute);

  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  projects: any[] = [];
  parcels: any[] = [];
  selectedProject: any | null = null;

  // Filters
  filterType = '';
  filterStatus = '';
  searchQuery = '';

  // Layer Controls
  showProjectsLayer = true;
  showParcelsLayer = true;

  private map: L.Map | null = null;
  private projectMarkersGroup: L.LayerGroup = L.layerGroup();
  private parcelPolygonsGroup: L.GeoJSON = L.geoJSON();

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const pId = params['projectId'];
      this.loadDistrictGisData(pId);
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadDistrictGisData(preselectedProjectId?: string) {
    this.loading.set(true);
    this.errorMessage.set('');

    this.districtService.getGisProjects().subscribe({
      next: (projRes) => {
        if (projRes.success && projRes.data) {
          this.projects = projRes.data;

          this.districtService.getGisParcels().subscribe({
            next: (parcelRes) => {
              this.loading.set(false);
              if (parcelRes.success && parcelRes.data) {
                this.parcels = parcelRes.data;
              }

              setTimeout(() => {
                this.initMap();
                if (preselectedProjectId) {
                  const target = this.projects.find(p => p.id === preselectedProjectId);
                  if (target) this.selectProject(target);
                }
              }, 100);
            },
            error: (err) => {
              this.loading.set(false);
              this.errorMessage.set(err.error?.message || 'Failed to load cadastral parcels');
              setTimeout(() => this.initMap(), 100);
            }
          });
        } else {
          this.loading.set(false);
          this.errorMessage.set(projRes.message || 'Failed to load district projects');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Server error loading GIS data');
      }
    });
  }

  private initMap() {
    if (this.map) return;

    const mapContainer = document.getElementById('district-map-canvas');
    if (!mapContainer) return;

    this.map = L.map('district-map-canvas', {
      center: [28.9845, 77.7064], // Meerut District Coordinates
      zoom: 11,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> | Survey of India / BhoomiSetu CALA',
      maxZoom: 19
    }).addTo(this.map);

    this.projectMarkersGroup.addTo(this.map);
    this.parcelPolygonsGroup.addTo(this.map);

    this.renderGisLayers();
  }

  renderGisLayers() {
    if (!this.map) return;

    this.projectMarkersGroup.clearLayers();
    this.parcelPolygonsGroup.clearLayers();

    // 1. Render Project Corridors Markers
    if (this.showProjectsLayer) {
      const filtered = this.getFilteredProjects();
      filtered.forEach(p => {
        if (!p.latitude || !p.longitude) return;

        const iconHtml = `
          <div class="custom-gis-marker ${p.status?.toLowerCase()}">
            <span class="marker-icon">🏗️</span>
            <span class="marker-label">${p.name}</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'bs-leaflet-marker-wrapper',
          html: iconHtml,
          iconSize: [120, 36],
          iconAnchor: [60, 18]
        });

        const marker = L.marker([p.latitude, p.longitude], { icon })
          .bindPopup(`
            <div class="bs-gis-popup">
              <div class="popup-header font-bold text-sm">${p.name}</div>
              <div class="popup-code font-mono text-xs text-muted">${p.projectCode}</div>
              <div class="popup-grid my-2 text-xs">
                <div><strong>Sector:</strong> ${p.projectType}</div>
                <div><strong>Status:</strong> ${p.status}</div>
                <div><strong>Acquired:</strong> ${p.landAcquiredHectares} / ${p.landRequiredHectares} Ha (${p.acquisitionPercentage}%)</div>
                <div><strong>Compensation:</strong> ₹${(p.totalCompensation / 10000000).toFixed(2)} Cr</div>
              </div>
              <div class="popup-actions mt-2">
                <a href="/district/verification" class="bs-btn bs-btn-xs bs-btn-primary w-100">📋 Field Verification</a>
              </div>
            </div>
          `);

        marker.on('click', () => {
          this.selectProject(p, false);
        });

        this.projectMarkersGroup.addLayer(marker);
      });
    }

    // 2. Render Cadastral Parcels GeoJSON Polygons
    if (this.showParcelsLayer && this.parcels.length > 0) {
      this.parcels.forEach(parcel => {
        if (!parcel.geoJsonGeometry) return;

        try {
          const geoJsonObj = JSON.parse(parcel.geoJsonGeometry);

          const statusColor = parcel.acquisitionStatus === 'PossessionTaken' ? '#10b981' :
                              parcel.acquisitionStatus === 'CompensationPaid' ? '#3b82f6' :
                              parcel.acquisitionStatus === 'Surveyed' ? '#fbbf24' : '#ef4444';

          const geoLayer = L.geoJSON(geoJsonObj, {
            style: {
              color: statusColor,
              weight: 2,
              opacity: 0.9,
              fillColor: statusColor,
              fillOpacity: 0.35
            }
          });

          geoLayer.bindPopup(`
            <div class="bs-gis-popup">
              <div class="popup-header font-bold text-sm">Survey No: ${parcel.surveyNumber}</div>
              <div class="popup-code font-mono text-xs text-muted">${parcel.parcelNumber} • ${parcel.villageName}</div>
              <div class="popup-grid my-2 text-xs">
                <div><strong>Area:</strong> ${parcel.areaHectares} Ha</div>
                <div><strong>Land Type:</strong> ${parcel.landType}</div>
                <div><strong>Status:</strong> ${parcel.acquisitionStatus}</div>
                <div><strong>Compensation:</strong> ₹${(parcel.compensationAssessed / 100000).toFixed(2)} Lakh</div>
                <div><strong>Owners:</strong> ${parcel.owners?.join(', ') || 'Registered Landholder'}</div>
              </div>
            </div>
          `);

          this.parcelPolygonsGroup.addLayer(geoLayer);
        } catch (e) {
          console.warn('Invalid GeoJSON on parcel:', parcel.parcelNumber, e);
        }
      });
    }
  }

  getFilteredProjects() {
    return this.projects.filter(p => {
      if (this.filterType && p.projectType !== this.filterType) return false;
      if (this.filterStatus && p.status !== this.filterStatus) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q);
      }
      return true;
    });
  }

  onFilterChange() {
    this.renderGisLayers();
  }

  toggleLayer(layer: 'projects' | 'parcels') {
    if (layer === 'projects') this.showProjectsLayer = !this.showProjectsLayer;
    if (layer === 'parcels') this.showParcelsLayer = !this.showParcelsLayer;
    this.renderGisLayers();
  }

  selectProject(p: any, panTo: boolean = true) {
    this.selectedProject = p;
    if (panTo && this.map && p.latitude && p.longitude) {
      this.map.flyTo([p.latitude, p.longitude], 13, { duration: 1.2 });
    }
  }

  fitDistrictBounds() {
    if (this.map) {
      this.map.flyTo([28.9845, 77.7064], 11, { duration: 1.0 });
    }
  }

  formatCurrency(value: number): string {
    if (!value || isNaN(value)) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
  }
}
