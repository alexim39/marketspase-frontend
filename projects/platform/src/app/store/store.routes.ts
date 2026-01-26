import { Routes } from "@angular/router";

export const StoreRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        loadComponent: () => import('./dashboard').then(c => c.StoreIndexComponent),
        title: "Marketer Store Dashboard - Manage all store campaign and promotion",
    },
    {
        path: 'create',
        loadComponent: () => import('./store-create/store-create.component').then(c => c.StoreCreateComponent),
        title: "Create New Store - New Store Setup",
    }, 
    { 
        path: 'edit/:id', 
        loadComponent: () => import('./edit-store/store-edit.component').then(c => c.StoreEditComponent),
        title: "Update Store Information - Store Setup",
    },
    {
        path: ':storeId/products/create',
        loadComponent: () => import('./products/add-products/add-product.component').then(c => c.AddProductComponent),
        title: "Create New Product - Add Product to Store",
    },
    {
        path: ':storeId/products',
        loadComponent: () => import('./products/view-products/view-products-index.component').then(c => c.ProductsComponent),
        title: "Store Product Management - List Products in Store",
    },

    
]
