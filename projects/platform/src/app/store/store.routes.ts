import { Routes } from "@angular/router";
import { StoreDashboardComponent } from "./components/store-dashboard/store-dashboard.component";


export const StoreRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: StoreDashboardComponent,
        title: "Marketer, Promoter Dashboard - Manage all campaign and promotion",
    },

    
]
