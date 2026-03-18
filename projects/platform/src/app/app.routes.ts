import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./index/index').then(c => c.AppLandingIndexComponent), },
    { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(r => r.dashboardRoutes) },
    { path: 'resources', loadChildren: () => import('./resources/resources.routes').then(r => r.RosourcesRoutes) }, 
    { path: 'legal', loadChildren: () => import('./legal/legal.routes').then(r => r.legalRoutes) },
    { path: 'store/:storeLink', loadComponent: () => import('./storefront/storefront.component').then(c => c.StorefrontComponent) },
    { path: 'ref/:username', loadComponent: () => import('./referral/referral-capture.component').then(c => c.ReferralCaptureComponent) },
    { path: 'product/:productId', loadComponent: () => import('./storefront/product-details/main/product-details.component').then(m => m.ProductDetailsComponent) }
];