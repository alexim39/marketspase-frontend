import { Routes } from "@angular/router";

export const StoreRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        loadComponent: () => import('.').then(c => c.StoreIndexComponent),
        title: "Store Dashboard - View and Manage all store",
    },
    {
        path: 'create',
        loadComponent: () => import('./marketer/store-create/store-create.component').then(c => c.StoreCreateComponent),
        title: "Create New Store - Setup your Marketer Store",
    }, 
    { 
        path: 'edit/:id', 
        loadComponent: () => import('./marketer/edit-store/store-edit.component').then(c => c.StoreEditComponent),
        title: "Edit Store - Update Store Information",
    },
    {
        path: ':storeId/products/create',
        loadComponent: () => import('./marketer/products/add-products/add-product.component').then(c => c.AddProductComponent),
        title: "Add New Product - Create Product for Store",
    },
    {
        path: ':storeId/products',
        loadComponent: () => import('./marketer/products/product-list/product-list-index.component').then(c => c.ProductListComponent),
        title: "Product List - View and Manage Store Products",
    },
    {
        path: ':storeId/products/:productId',
        loadComponent: () => import('./marketer/products/product-detail/product-detail.component').then(c => c.ProductDetailComponent),
        title: "Product Details - View and Manage Product Information",
    },

    
]
