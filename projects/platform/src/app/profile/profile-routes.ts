import { Routes } from '@angular/router';

export const ProfileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./').then(c => c.ProfileIndexComponent),
    title: 'Profile - Manage profile detail and more',
  },
  {
    path: ':id',
    loadComponent: () => import('./').then(c => c.ProfileIndexComponent),
    title: 'Profile - Manage profile detail and more',
  },
];
