import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./index.component').then(c => c.IndexComponent), },
    { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(r => r.dashboardRoutes) },
    { path: 'resources', loadChildren: () => import('./resources/resources.routes').then(r => r.RosourcesRoutes) }, 
    { path: 'legal', loadChildren: () => import('./legal/legal.routes').then(r => r.legalRoutes) },
    { path: 'store/:storeLink', loadComponent: () => import('./storefront/storefront.component').then(c => c.StorefrontComponent) },
    { path: 'ref/:username', loadComponent: () => import('./referral/referral-capture.component').then(c => c.ReferralCaptureComponent) },
];