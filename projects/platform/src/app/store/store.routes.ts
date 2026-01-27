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
        path: 'edit/:id', 
        loadComponent: () => import('./marketer/edit-store/store-edit.component').then(c => c.StoreEditComponent),
        title: "Edit Store - Update Store Information",
    },

    {
        path: 'product/:productId',
        loadComponent: () => import('./promoter/product-detail/promoter-product-details.component').then(c => c.PromoterProductDetailsComponent),
        title: "Product Details - View Product Information",
    }, 

    {
        path: ':storeId/products/create',
        loadComponent: () => import('./marketer/products/add-products/add-product.component').then(c => c.AddProductComponent),
        title: "Add New Product - Create Product for Store",
    },

    {
        path: ':storeId/products',
        loadComponent: () => import('./marketer/products/product-list/marketer-product-list-index.component').then(c => c.MarketerProductListComponent),
        title: "Product List - View and Manage Store Products",
    },

    {
        path: ':storeId/products/:productId',
        loadComponent: () => import('./marketer/products/product-detail/marketer-product-detail.component').then(c => c.MarketerProductDetailComponent),
        title: "Product Details - View and Manage Product Information",
    },

    
]
