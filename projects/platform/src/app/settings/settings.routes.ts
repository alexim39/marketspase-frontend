import { Routes } from '@angular/router';

export const SettingsRoutes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'setting',
  //   pathMatch: 'full',
  // },
  {
    path: '',
    loadComponent: () => import('./index.component').then(c => c.SettingsIndexComponent),
    title: 'Settings - Configure your account and system settings',
    children: [
      {
        path: '',
        redirectTo: 'account',
        pathMatch: 'full',
      },
      {
        path: 'system',
        loadComponent: () => import('./system').then(c => c.SystemSettingIndexComponent),
        title: "System Setting - Configure the look and feel",
      },
      {
        path: 'account',
        loadComponent: () => import('./account').then(c => c.AccountIndexComponent),
        title: "Account Setting - Configure your profile settings",
      },
      {
        path: 'support',
        loadComponent: () => import('./support').then(c => c.SupportIndexComponent),
        title: "Support & Testimonial - Get support and testify about MarketSpase",
      },
      {
        path: 'ads',
        children: [
          {
            path: 'preferences',
            loadComponent: () => import('./ads/preference').then(c => c.AdsPreferenceIndexComponent),
            title: "Ads Preferences - Configure your ad preferences",
          }
        ]
      }
    ],
  },
];
