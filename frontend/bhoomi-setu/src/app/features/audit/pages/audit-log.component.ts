import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../administration/services/admin.service';
import { AuditActivityLog } from '../../administration/models/admin.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss'
})
export class AuditLogComponent implements OnInit {
  private adminService = inject(AdminService);

  logs: AuditActivityLog[] = [];
  filteredLogs: AuditActivityLog[] = [];
  loading = false;

  authCount = 0;
  mutationCount = 0;

  // Filters
  searchQuery = '';
  selectedAction = '';
  selectedEntity = '';

  // Inspection modal
  selectedLog: AuditActivityLog | null = null;

  ngOnInit() {
    this.loadAuditLogs();
  }

  loadAuditLogs() {
    this.loading = true;
    this.adminService.getRecentActivity().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.logs = res.data || [];
          this.calculateStats();
          this.applyFilters();
        }
      },
      error: () => {
        this.loading = false;
        this.loadMockFallbackData();
      }
    });
  }

  loadMockFallbackData() {
    this.logs = [
      {
        id: 'aud_101',
        username: 'super.admin',
        action: 'UPDATE_ROLE_PERMISSIONS',
        entityType: 'RolePermission',
        entityId: 'role_project_agency',
        oldValuesJson: '{"grantedPermissions":["VIEW_PROJECTS"]}',
        newValuesJson: '{"grantedPermissions":["VIEW_PROJECTS","CREATE_PROPOSALS","EDIT_PARCELS"]}',
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString()
      },
      {
        id: 'aud_102',
        username: 'state.admin',
        action: 'APPROVE_PROPOSAL',
        entityType: 'Proposal',
        entityId: 'PROP-2026-UP-001024',
        oldValuesJson: '{"status":"Submitted"}',
        newValuesJson: '{"status":"Approved"}',
        ipAddress: '192.168.1.105',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'aud_103',
        username: 'district.admin',
        action: 'CREATE_PARCEL',
        entityType: 'LandParcel',
        entityId: 'PARCEL-SURVEY-402',
        oldValuesJson: '{}',
        newValuesJson: '{"surveyNumber":"402/A","areaHectares":14.5,"status":"Proposed"}',
        ipAddress: '192.168.1.112',
        createdAt: new Date(Date.now() - 7200000).toISOString()
      },
      {
        id: 'aud_104',
        username: 'central.admin',
        action: 'LOGIN_SUCCESS',
        entityType: 'UserSession',
        entityId: 'sess_9942',
        oldValuesJson: '{}',
        newValuesJson: '{"loginAt":"2026-08-24 09:15:00","ip":"10.0.4.12"}',
        ipAddress: '10.0.4.12',
        createdAt: new Date(Date.now() - 14400000).toISOString()
      }
    ];
    this.calculateStats();
    this.applyFilters();
  }

  calculateStats() {
    this.authCount = this.logs.filter(l => l.action.includes('LOGIN') || l.entityType.includes('Session')).length;
    this.mutationCount = this.logs.length - this.authCount;
  }

  applyFilters() {
    this.filteredLogs = this.logs.filter(log => {
      const query = this.searchQuery.toLowerCase();
      const matchesSearch = !query ||
        log.username.toLowerCase().includes(query) ||
        log.action.toLowerCase().includes(query) ||
        log.entityType.toLowerCase().includes(query) ||
        (log.entityId && log.entityId.toLowerCase().includes(query)) ||
        log.ipAddress.includes(query);

      const matchesAction = !this.selectedAction || log.action.toUpperCase().includes(this.selectedAction);
      const matchesEntity = !this.selectedEntity || log.entityType.toLowerCase() === this.selectedEntity.toLowerCase();

      return matchesSearch && matchesAction && matchesEntity;
    });
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedAction = '';
    this.selectedEntity = '';
    this.applyFilters();
  }

  getActionTagClass(action: string): string {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('ADD')) return 'create';
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'update';
    if (act.includes('DELETE') || act.includes('DISABLE')) return 'delete';
    if (act.includes('LOGIN') || act.includes('AUTH')) return 'auth';
    return 'default';
  }

  inspectLog(log: AuditActivityLog) {
    this.selectedLog = log;
  }

  closeModal() {
    this.selectedLog = null;
  }

  formatJson(jsonStr?: string): string {
    if (!jsonStr) return 'N/A (No Payload)';
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return jsonStr;
    }
  }

  exportCsv() {
    const headers = ['ID', 'Timestamp', 'Actor Username', 'Action', 'Entity Type', 'Entity ID', 'IP Address'];
    const rows = this.filteredLogs.map(l => [
      l.id,
      l.createdAt,
      l.username,
      l.action,
      l.entityType,
      l.entityId || 'N/A',
      l.ipAddress
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,'
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BhoomiSetu_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
