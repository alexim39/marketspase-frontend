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
        loadComponent: () => import('./system/system.component').then(c => c.SystemSettingComponent),
        title: "System Setting - Configure the look and feel",
      },
      {
        path: 'account',
        loadComponent: () => import('./account/account.component').then(c => c.AccountComponent),
        title: "Account Setting - Configure your profile settings",
      },
      {
        path: 'share',
        loadComponent: () => import('./support/support.component').then(c => c.SupportComponent),
        title: "Support & Testimonial - Get support and testify about MarketSpase",
      },
    ],
  },
];