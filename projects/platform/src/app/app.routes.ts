import { Routes } from '@angular/router';
import { IndexComponent } from './index.component';

export const routes: Routes = [
    { path: '', component: IndexComponent },
    { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(r => r.dashboardRoutes) },

];
