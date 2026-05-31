import { Routes } from '@angular/router';

export const AdminRoutes: Routes = [
  {
    path: 'ppc-analytics',
    loadComponent: () =>
      import('./ppc-analytics/ppc-analytics.component').then((c) => c.PpcAnalyticsComponent),
    title: 'PPC Analytics - Ads & Promotion',
  },
];

