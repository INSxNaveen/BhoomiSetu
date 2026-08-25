import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CentralAdminService } from '../../services/central-admin.service';
import { NationalGisProject } from '../../models/central-admin.models';

import * as L from 'leaflet';

@Component({
  selector: 'app-national-gis',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './national-gis.component.html',
  styleUrl: './national-gis.component.scss'
})
export class NationalGisComponent implements OnInit, OnDestroy {
  private centralService = inject(CentralAdminService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(true);
  errorMessage = signal('');

  projects: NationalGisProject[] = [];
  parcels: any[] = [];

  // Filter State
  filterState = '';
  filterDistrict = '';
  filterType = '';
  filterStatus = '';
  filterSearch = '';

  // Layer Toggles
  showProjectsLayer = true;
  showParcelsLayer = true;
  showDistrictsLayer = true;

  private map: L.Map | null = null;
  private projectMarkersGroup: L.LayerGroup = L.layerGroup();
  private parcelPolygonsGroup: L.GeoJSON = L.geoJSON();

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['state']) {
        this.filterState = params['state'];
      }
      this.loadGisData();
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadGisData() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.centralService.getGisProjects().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.projects = res.data;
          this.loadParcels();
        } else {
          this.loading.set(false);
          this.errorMessage.set(res.message || 'Failed to load GIS project markers.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Unable to connect to National GIS API.');
      }
    });
  }

  loadParcels() {
    this.centralService.getGisParcels().subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          this.parcels = res.data;
        }
        setTimeout(() => this.initMap(), 100);
      },
      error: () => {
        this.loading.set(false);
        setTimeout(() => this.initMap(), 100);
      }
    });
  }

  initMap() {
    const mapElement = document.getElementById('national-gis-map-canvas');
    if (!mapElement) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map('national-gis-map-canvas', {
      center: [22.5937, 78.9629],
      zoom: 5,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(this.map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | BhoomiSetu National GIS Command Center'
    }).addTo(this.map);

    this.projectMarkersGroup.addTo(this.map);
    this.parcelPolygonsGroup.addTo(this.map);

    this.applyFilters();
  }

  applyFilters() {
    this.renderProjects();
    this.renderParcels();
  }

  resetFilters() {
    this.filterState = '';
    this.filterDistrict = '';
    this.filterType = '';
    this.filterStatus = '';
    this.filterSearch = '';
    this.applyFilters();
    this.fitIndia();
  }

  renderProjects() {
    this.projectMarkersGroup.clearLayers();
    if (!this.showProjectsLayer || !this.map) return;

    const filtered = this.projects.filter(p => {
      const matchState = !this.filterState || p.stateName.toLowerCase().includes(this.filterState.toLowerCase());
      const matchDistrict = !this.filterDistrict || p.districtName.toLowerCase().includes(this.filterDistrict.toLowerCase());
      const matchType = !this.filterType || p.projectType.toString() === this.filterType;
      const matchStatus = !this.filterStatus || p.status.toString() === this.filterStatus;
      const matchSearch = !this.filterSearch || p.name.toLowerCase().includes(this.filterSearch.toLowerCase()) || p.projectCode.toLowerCase().includes(this.filterSearch.toLowerCase());
      return matchState && matchDistrict && matchType && matchStatus && matchSearch;
    });

    filtered.forEach(proj => {
      const color = this.getMarkerColor(proj);
      const customIcon = L.divIcon({
        className: 'custom-gis-pin',
        html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #FFFFFF; box-shadow: 0 3px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 10px; font-weight: bold;">●</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; min-width: 250px; line-height: 1.45;">
          <div style="font-size: 11px; font-weight: 800; color: #1D4ED8; text-transform: uppercase;">${proj.projectCode}</div>
          <div style="font-weight: 800; color: #0B2545; font-size: 15px; margin: 2px 0 6px;">${proj.name}</div>
          <div style="font-size: 12px; color: #64748B; margin-bottom: 8px;">📍 ${proj.districtName}, ${proj.stateName}</div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #F8FAFC; padding: 8px; border-radius: 6px; border: 1px solid #E2E8F0; margin-bottom: 10px;">
            <div><span style="font-size: 10px; color: #64748B; display: block;">PROPOSED AREA</span><strong>${proj.requiredAreaHectares} Ha</strong></div>
            <div><span style="font-size: 10px; color: #64748B; display: block;">ACQUIRED AREA</span><strong style="color: #059669;">${proj.acquiredAreaHectares} Ha</strong></div>
            <div><span style="font-size: 10px; color: #64748B; display: block;">COMPENSATION</span><strong>₹${(proj.compensationPaid / 10000000).toFixed(1)} Cr</strong></div>
            <div><span style="font-size: 10px; color: #64748B; display: block;">PROGRESS</span><strong style="color: #1D4ED8;">${proj.progressPercentage}%</strong></div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 11px; font-weight: 700; color: #059669;">✓ ${proj.possessionStatus}</span>
            <a href="/projects" style="background: #1D4ED8; color: #FFFFFF; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 4px; text-decoration: none;">View Project →</a>
          </div>
        </div>
      `;

      const marker = L.marker([proj.latitude, proj.longitude], { icon: customIcon });
      marker.bindPopup(popupContent);
      this.projectMarkersGroup.addLayer(marker);
    });

    if (this.filterState && filtered.length > 0 && this.map) {
      const first = filtered[0];
      this.map.setView([first.latitude, first.longitude], 7);
    }
  }

  renderParcels() {
    this.parcelPolygonsGroup.clearLayers();
    if (!this.showParcelsLayer || !this.map) return;

    this.parcels.forEach(parcel => {
      if (!parcel.geoJsonGeometry) return;
      try {
        const geojson = JSON.parse(parcel.geoJsonGeometry);
        const color = parcel.acquisitionStatus === 6 || parcel.acquisitionStatus === 'PossessionTaken' ? '#10B981' : '#F59E0B';

        const layer = L.geoJSON(geojson, {
          style: {
            color: color,
            weight: 2,
            opacity: 0.9,
            fillColor: color,
            fillOpacity: 0.35
          }
        });

        const popup = `
          <div style="font-family: inherit; font-size: 12px; min-width: 200px;">
            <div style="font-weight: 800; color: #0B2545; font-size: 13px;">Survey #${parcel.surveyNumber}</div>
            <div style="color: #64748B; font-size: 11px;">Parcel: ${parcel.parcelNumber} • ${parcel.villageName}</div>
            <div style="margin: 6px 0; padding: 4px 0; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
              <div>Area: <strong>${parcel.areaHectares} Ha</strong> (${parcel.landType})</div>
              <div>Status: <strong style="color: ${color};">${parcel.acquisitionStatus}</strong></div>
            </div>
            <div style="font-size: 11px; color: #64748B;">Project: ${parcel.projectName}</div>
          </div>
        `;
        layer.bindPopup(popup);
        this.parcelPolygonsGroup.addLayer(layer);
      } catch (e) {
        // Invalid GeoJSON string fallback
      }
    });
  }

  getMarkerColor(proj: NationalGisProject): string {
    if (proj.status === 8 || proj.status === 'Completed') return '#64748B';
    if (proj.status === 9 || proj.status === 'OnHold') return '#EAB308';
    if (proj.status === 0 || proj.status === 'Planning' || proj.status === 1 || proj.status === 'ProposalSubmitted') return '#3B82F6';
    return '#10B981';
  }

  fitIndia() {
    if (this.map) {
      this.map.setView([22.5937, 78.9629], 5);
    }
  }

  toggleLayer(layerType: 'projects' | 'parcels' | 'districts') {
    if (layerType === 'projects') {
      this.showProjectsLayer = !this.showProjectsLayer;
      this.renderProjects();
    } else if (layerType === 'parcels') {
      this.showParcelsLayer = !this.showParcelsLayer;
      this.renderParcels();
    } else if (layerType === 'districts') {
      this.showDistrictsLayer = !this.showDistrictsLayer;
    }
  }
}
