import { Routes } from '@angular/router';
import { IndexComponent } from './index.component';

export const routes: Routes = [
    { path: '', component: IndexComponent },
    { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(r => r.dashboardRoutes) },
    { path: 'about', loadChildren: () => import('./about/about.routes').then(r => r.AboutRoutes) }, 
    { path: 'legal', loadChildren: () => import('./legal/legal.routes').then(r => r.legalRoutes) },

];
