import { SUPER_ADMIN_CONFIG } from '../role-configs';
import { Routes } from '@angular/router';

export const SUPER_ADMIN_ROLE_CONFIG = SUPER_ADMIN_CONFIG;

export const SUPER_ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: '/administration', pathMatch: 'full' }
];
