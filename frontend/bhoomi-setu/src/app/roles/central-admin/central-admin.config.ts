import { CENTRAL_ADMIN_CONFIG } from '../role-configs';
import { Routes } from '@angular/router';

export const CENTRAL_ADMIN_ROLE_CONFIG = CENTRAL_ADMIN_CONFIG;

export const CENTRAL_ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];
