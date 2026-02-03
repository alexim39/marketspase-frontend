import { Routes } from "@angular/router";

export const StoreRoutes: Routes = [

    {   path: '', 
        loadComponent: () => import('../store/store-management/store-management.component').then(c => c.StoreManagementComponent),
        title: 'Stores Management - Admin Dashboard'
    }, 
    {
        path: 'products/:storeId',
        loadComponent: () => import('../store/products/store-products.component').then(c => c.StoreProductsComponent),
        title: "Store Products - Store Management",
    }, 
   
    
]
