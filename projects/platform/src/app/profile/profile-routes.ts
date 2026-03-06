import { Routes } from '@angular/router';

export const ProfileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile-page.component').then(c => c.ProfilePageComponent),
    title: 'Profile - Manage profile detail and more',
  },
  {
    path: ':id',
    loadComponent: () => import('./profile-page.component').then(c => c.ProfilePageComponent),
    title: 'Profile - Manage profile detail and more',
  },
];