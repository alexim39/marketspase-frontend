import { Routes } from "@angular/router";
import { StoreDashboardComponent } from "./dashboard/store-dashboard/store-dashboard.component";
import { StoreCreateComponent } from "./store-create/store-create.component";
import { AddProductComponent } from "./products/add-products/add-product.component";


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
    {
        path: ':storeId/products/create',
        component: AddProductComponent,
        title: "Create New Product - Add Product to Store",
    },

    
]
