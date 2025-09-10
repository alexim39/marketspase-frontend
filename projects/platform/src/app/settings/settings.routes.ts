import { Routes } from '@angular/router';
import { SettingsIndexComponent } from './index.component';
import { AccountComponent } from './account/account.component';
import { SupportComponent } from './support/support.component';
import { SystemSettingComponent } from './system/system.component';

export const SettingsRoutes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'setting',
  //   pathMatch: 'full',
  // },
  {
    path: '',
    component: SettingsIndexComponent,
    title: 'Settings - Configure your account and system settings',
    children: [
      {
        path: '',
        redirectTo: 'account',
        pathMatch: 'full',
      },
      {
        path: 'system',
        component: SystemSettingComponent,
        title: "System Setting - Configure the look and feel",
      },
      {
        path: 'account',
        component: AccountComponent,
        title: "Account Setting - Configure your profile settings",
      },
      {
        path: 'share',
        component: SupportComponent,
        title: "Support & Testimonial - Get support and testify about MarketSpase",
      },
    ],
  },
];