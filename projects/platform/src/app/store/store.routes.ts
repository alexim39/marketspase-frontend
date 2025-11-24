import { Routes } from "@angular/router";
import { StoreDashboardComponent } from "./components/store-dashboard/store-dashboard.component";
import { StoreCreateComponent } from "./components/store-create/store-create.component";


export const StoreRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: StoreDashboardComponent,
        title: "Marketer Store Dashboard - Manage all store campaign and promotion",
    },
    {
        path: 'create',
        component: StoreCreateComponent,
        title: "Create New Store - New Store Setup",
    }, 

    
]
