import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  public selectedStateId = signal<string | null>(null);
  public selectedDistrictId = signal<string | null>(null);
  public sidebarCollapsed = signal<boolean>(false);

  toggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }
}
