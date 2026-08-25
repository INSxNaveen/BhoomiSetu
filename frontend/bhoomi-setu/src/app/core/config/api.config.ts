import { environment } from '../../../environments/environment';

export const ENVIRONMENT = {
  production: environment.production,
  apiBaseUrl: environment.apiUrl
};

export const API_ENDPOINTS = {
  auth: {
    login: `${ENVIRONMENT.apiBaseUrl}/auth/login`
  },
  dashboard: {
    summary: `${ENVIRONMENT.apiBaseUrl}/dashboard/summary`
  },
  projects: `${ENVIRONMENT.apiBaseUrl}/projects`,
  proposals: `${ENVIRONMENT.apiBaseUrl}/proposals`,
  gis: {
    parcels: `${ENVIRONMENT.apiBaseUrl}/gis/parcels`
  },
  compensation: `${ENVIRONMENT.apiBaseUrl}/compensation`,
  possession: `${ENVIRONMENT.apiBaseUrl}/possession`,
  rehabilitation: `${ENVIRONMENT.apiBaseUrl}/rehabilitation`
};
