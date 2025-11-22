import { Routes } from '@angular/router';
import { IndexComponent } from './index.component';

export const routes: Routes = [
    { path: '', component: IndexComponent },
    { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(r => r.dashboardRoutes) },
    { path: 'resources', loadChildren: () => import('./resources/resources.routes').then(r => r.RosourcesRoutes) }, 
    { path: 'legal', loadChildren: () => import('./legal/legal.routes').then(r => r.legalRoutes) },
    // Fixed referral route
    { 
        path: 'ref/:username', 
        loadComponent: () => import('./referral/referral-capture.component').then(c => c.ReferralCaptureComponent) 
    },
];