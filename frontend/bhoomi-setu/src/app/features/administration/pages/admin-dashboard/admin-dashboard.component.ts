import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import {
  AdminDashboardKpi,
  ServiceHealthItem,
  UserDistribution,
  AuditActivityLog
} from '../../models/admin.models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss'
})
export class AdminDashboardComponent implements OnInit {
  adminService = inject(AdminService);

  kpis: AdminDashboardKpi | null = null;
  healthItems: ServiceHealthItem[] = [];
  userDist: UserDistribution[] = [];
  recentActivity: AuditActivityLog[] = [];

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.adminService.getDashboardKpis().subscribe({
      next: (res) => { if (res.success) this.kpis = res.data; }
    });

    this.adminService.getSystemHealth().subscribe({
      next: (res) => { if (res.success) this.healthItems = res.data; }
    });

    this.adminService.getUserDistribution().subscribe({
      next: (res) => { if (res.success) this.userDist = res.data; }
    });

    this.adminService.getRecentActivity().subscribe({
      next: (res) => { if (res.success) this.recentActivity = res.data; }
    });
  }
}
