import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CentralAdminService } from '../../services/central-admin.service';
import {
  NationalDashboardData,
  NationalKpiSummary,
  PipelineStage,
  StateProgressItem,
  DelayedProjectItem,
  NationalGisProject
} from '../../models/central-admin.models';

import * as L from 'leaflet';

@Component({
  selector: 'app-national-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './national-dashboard.component.html',
  styleUrl: './national-dashboard.component.scss'
})
export class NationalDashboardComponent implements OnInit, OnDestroy {
  private centralService = inject(CentralAdminService);
  private router = inject(Router);

  loading = signal(true);
  refreshing = signal(false);
  errorMessage = signal('');

  data: NationalDashboardData | null = null;
  filteredProjects: NationalGisProject[] = [];

  // Map Filter state
  selectedStateFilter = '';
  selectedTypeFilter = '';
  selectedStatusFilter = '';

  private map: L.Map | null = null;
  private markersLayer: L.LayerGroup = L.layerGroup();

  ngOnInit() {
    this.loadDashboardData();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  loadDashboardData(isRefresh = false) {
    if (isRefresh) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.errorMessage.set('');

    this.centralService.getDashboard().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.refreshing.set(false);
        if (res.success && res.data) {
          this.data = res.data;
          this.applyMapFilters();
          setTimeout(() => this.initMap(), 100);
        } else {
          this.errorMessage.set(res.message || 'Failed to load national operations data.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.refreshing.set(false);
        this.errorMessage.set(err.error?.message || 'Unable to connect to Central Admin API.');
      }
    });
  }

  onRefresh() {
    if (this.refreshing() || this.loading()) return;
    this.loadDashboardData(true);
  }

  applyMapFilters() {
    if (!this.data) return;
    this.filteredProjects = this.data.mapProjects.filter(p => {
      const matchState = !this.selectedStateFilter || p.stateName.toLowerCase().includes(this.selectedStateFilter.toLowerCase()) || p.stateId === this.selectedStateFilter;
      const matchType = !this.selectedTypeFilter || p.projectType.toString() === this.selectedTypeFilter;
      const matchStatus = !this.selectedStatusFilter || p.status.toString() === this.selectedStatusFilter;
      return matchState && matchType && matchStatus;
    });

    this.renderMapMarkers();
  }

  initMap() {
    const mapElement = document.getElementById('national-dashboard-map');
    if (!mapElement) return;

    if (this.map) {
      this.map.remove();
    }

    // Default India Center [22.5937, 78.9629], Zoom 5
    this.map = L.map('national-dashboard-map', {
      center: [22.5937, 78.9629],
      zoom: 5,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | BhoomiSetu National GIS'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.renderMapMarkers();
  }

  renderMapMarkers() {
    if (!this.map) return;
    this.markersLayer.clearLayers();

    this.filteredProjects.forEach(proj => {
      const color = this.getMarkerColor(proj);
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid #FFFFFF; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; min-width: 220px; line-height: 1.4;">
          <div style="font-weight: 800; color: #0B2545; margin-bottom: 4px; font-size: 14px;">${proj.name}</div>
          <div style="font-size: 11px; color: #64748B; margin-bottom: 8px;">Code: <strong>${proj.projectCode}</strong> • ${proj.stateName}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 6px 0; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0; margin-bottom: 8px;">
            <div><span style="font-size: 10px; color: #64748B; display: block;">PROPOSED</span><strong>${proj.requiredAreaHectares} Ha</strong></div>
            <div><span style="font-size: 10px; color: #64748B; display: block;">PROGRESS</span><strong style="color: #059669;">${proj.progressPercentage}%</strong></div>
            <div><span style="font-size: 10px; color: #64748B; display: block;">COMPENSATION</span><strong>₹${(proj.compensationPaid / 10000000).toFixed(1)} Cr</strong></div>
            <div><span style="font-size: 10px; color: #64748B; display: block;">POSSESSION</span><strong>${proj.possessionStatus}</strong></div>
          </div>
          <div style="text-align: right;">
            <a href="/central/gis" style="color: #1D4ED8; font-weight: 700; text-decoration: none; font-size: 12px;">Inspect in Full GIS →</a>
          </div>
        </div>
      `;

      const marker = L.marker([proj.latitude, proj.longitude], { icon: customIcon });
      marker.bindPopup(popupContent);
      this.markersLayer.addLayer(marker);
    });
  }

  getMarkerColor(proj: NationalGisProject): string {
    if (proj.status === 8 || proj.status === 'Completed') return '#64748B'; // Grey
    if (proj.status === 9 || proj.status === 'OnHold') return '#EAB308'; // Amber/Delayed
    if (proj.status === 0 || proj.status === 'Planning' || proj.status === 1 || proj.status === 'ProposalSubmitted') return '#3B82F6'; // Blue
    return '#10B981'; // Green (Active/Possession)
  }

  fitIndiaBounds() {
    if (this.map) {
      this.map.setView([22.5937, 78.9629], 5);
    }
  }

  navigateToGisWithState(stateName: string) {
    this.router.navigate(['/central/gis'], { queryParams: { state: stateName } });
  }

  formatCrores(amount: number): string {
    return (amount / 10000000).toFixed(2);
  }

  formatSqKm(hectares: number): string {
    // 100 Hectares = 1 sq km
    return (hectares / 100).toFixed(2);
  }
}
