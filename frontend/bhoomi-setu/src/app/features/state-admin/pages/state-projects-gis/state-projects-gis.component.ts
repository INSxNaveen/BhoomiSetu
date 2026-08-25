import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { StateAdminService, StateGisProject, StateGisParcel } from '../../services/state-admin.service';

import * as L from 'leaflet';

@Component({
  selector: 'app-state-projects-gis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './state-projects-gis.component.html',
  styleUrl: './state-projects-gis.component.scss'
})
export class StateProjectsGisComponent implements OnInit, OnDestroy {
  private stateAdminService = inject(StateAdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal<boolean>(true);
  errorMessage = signal<string>('');

  projects: StateGisProject[] = [];
  parcels: StateGisParcel[] = [];
  selectedProject: StateGisProject | null = null;

  // Filters
  filterDistrict = '';
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
      this.loadStateGisData(pId);
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadStateGisData(focusProjectId?: string) {
    this.loading.set(true);
    this.errorMessage.set('');

    this.stateAdminService.getGisProjects(this.filterDistrict || undefined).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.projects = res.data;
          
          this.stateAdminService.getGisParcels().subscribe({
            next: (parcelRes) => {
              this.loading.set(false);
              if (parcelRes.success && parcelRes.data) {
                this.parcels = parcelRes.data;
              }
              this.initMap(focusProjectId);
            },
            error: () => {
              this.loading.set(false);
              this.initMap(focusProjectId);
            }
          });
        } else {
          this.loading.set(false);
          this.errorMessage.set(res.message || 'Failed to load state projects.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Error communicating with GIS server.');
      }
    });
  }

  initMap(focusProjectId?: string) {
    setTimeout(() => {
      const mapContainer = document.getElementById('stateGisMap');
      if (!mapContainer) return;

      if (this.map) {
        this.map.remove();
      }

      // Center around Uttar Pradesh / State centroid
      this.map = L.map('stateGisMap', {
        center: [28.60, 77.65],
        zoom: 9,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(this.map);

      // CartoDB Positron / OSM Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(this.map);

      this.projectMarkersGroup.addTo(this.map);
      this.parcelPolygonsGroup.addTo(this.map);

      this.renderProjectMarkers();
      this.renderParcelPolygons();

      if (focusProjectId) {
        const target = this.projects.find(p => p.id === focusProjectId);
        if (target) {
          this.selectProject(target);
        }
      }
    }, 100);
  }

  renderProjectMarkers() {
    this.projectMarkersGroup.clearLayers();
    if (!this.showProjectsLayer || !this.map) return;

    const filtered = this.getFilteredProjects();

    filtered.forEach(p => {
      const iconHtml = `
        <div class="gis-project-marker ${p.status.toLowerCase()}">
          <span class="marker-icon">${this.getProjectTypeIcon(p.projectType)}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: customIcon });

      const popupContent = `
        <div class="gis-popup">
          <div class="popup-header">
            <span class="popup-code">${p.projectCode}</span>
            <span class="popup-badge">${p.status}</span>
          </div>
          <h4 class="popup-title">${p.name}</h4>
          <div class="popup-meta">
            <span>📍 ${p.districtName}</span> • <span>🏷️ ${p.projectType}</span>
          </div>
          <div class="popup-stats">
            <div class="stat-box">
              <span class="label">Required Land</span>
              <span class="val">${p.requiredAreaHectares} Ha</span>
            </div>
            <div class="stat-box">
              <span class="label">Acquired</span>
              <span class="val">${p.acquiredAreaHectares} Ha (${p.progressPercentage}%)</span>
            </div>
          </div>
          <div class="popup-actions mt-2">
            <a href="/state/proposals" class="popup-btn">Review Statutory Proposal 📋</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });
      marker.on('click', () => {
        this.selectedProject = p;
      });

      this.projectMarkersGroup.addLayer(marker);
    });
  }

  renderParcelPolygons() {
    this.parcelPolygonsGroup.clearLayers();
    if (!this.showParcelsLayer || !this.map) return;

    this.parcels.forEach(parcel => {
      if (!parcel.geoJsonGeometry) return;

      try {
        const geojson = JSON.parse(parcel.geoJsonGeometry);
        const isAcquired = parcel.acquisitionStatus === 'PossessionTaken' || parcel.acquisitionStatus === 'CompensationPaid';

        const style = {
          color: isAcquired ? '#059669' : '#2563eb',
          weight: 2,
          opacity: 0.9,
          fillColor: isAcquired ? '#10b981' : '#3b82f6',
          fillOpacity: 0.35
        };

        const layer = L.geoJSON(geojson, {
          style: style,
          onEachFeature: (feature, l) => {
            const popup = `
              <div class="gis-popup parcel-popup">
                <div class="popup-header">
                  <span class="popup-code">Khasra / Survey: ${parcel.surveyNumber}</span>
                  <span class="popup-badge">${parcel.acquisitionStatus}</span>
                </div>
                <h4 class="popup-title">Parcel ${parcel.parcelNumber} • ${parcel.villageName}</h4>
                <div class="popup-meta">
                  <span>📐 Area: ${parcel.areaHectares} Ha</span> • <span>🌾 Type: ${parcel.landType}</span>
                </div>
                <div class="popup-owners mt-2">
                  <strong>Landowner(s):</strong> ${parcel.ownerNames?.join(', ') || 'Registered Landholder'}
                </div>
                <div class="popup-comp mt-1">
                  <strong>Compensation:</strong> ₹${(parcel.compensationAmount / 100000).toFixed(2)} Lakhs
                </div>
              </div>
            `;
            l.bindPopup(popup, { maxWidth: 280 });
          }
        });

        this.parcelPolygonsGroup.addLayer(layer);
      } catch (e) {
        console.error('Failed to parse GeoJSON polygon for parcel:', parcel.parcelNumber, e);
      }
    });
  }

  toggleProjectsLayer() {
    this.showProjectsLayer = !this.showProjectsLayer;
    this.renderProjectMarkers();
  }

  toggleParcelsLayer() {
    this.showParcelsLayer = !this.showParcelsLayer;
    this.renderParcelPolygons();
  }

  selectProject(p: StateGisProject) {
    this.selectedProject = p;
    if (this.map) {
      this.map.flyTo([p.latitude, p.longitude], 12, { duration: 1.2 });
    }
  }

  fitStateBounds() {
    if (!this.map || !this.projects.length) return;
    const group = L.featureGroup(this.projectMarkersGroup.getLayers() as L.Layer[]);
    if (group.getLayers().length > 0) {
      this.map.fitBounds(group.getBounds().pad(0.2));
    }
  }

  getFilteredProjects(): StateGisProject[] {
    return this.projects.filter(p => {
      if (this.filterDistrict && p.districtName !== this.filterDistrict) return false;
      if (this.filterType && p.projectType !== this.filterType) return false;
      if (this.filterStatus && p.status !== this.filterStatus) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.projectCode.toLowerCase().includes(q);
      }
      return true;
    });
  }

  getProjectTypeIcon(type: string): string {
    switch (type) {
      case 'NationalHighway': return '🛣️';
      case 'IndustrialCorridor': return '🏭';
      case 'RailwayLine': return '🚆';
      case 'PowerAndEnergy': return '⚡';
      default: return '📍';
    }
  }

  formatCurrency(val: number): string {
    if (!val) return '₹0';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} L`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  }
}
