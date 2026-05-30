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
        path: 'products',
        loadComponent: () => import('./promoter/products-list').then(c => c.PromoterProductsListIndexComponent),
        title: "Promoted products - View and Manage Product you are promoting",
    },

    {
        path: 'orders',
        loadComponent: () => import('./orders').then(c => c.StorefrontOrdersIndexComponent),
        title: "Storefront Orders - Delivery and Release Review",
    },

    {
        path: 'support',
        loadComponent: () => import('./marketer/customer-support/customer-support.component').then(c => c.CustomerSupportComponent),
        title: "Customer Support - Buyer CRM",
    },

    {
        path: 'subscribers',
        loadComponent: () => import('./marketer/subscribers').then(c => c.StoreEmailSubscribersIndexComponent),
        title: "Email Subscribers - Storefront Newsletter List",
    },

    {
        path: 'promoted-products-analytics',
        loadComponent: () => import('./marketer/promoted-products-analytics').then(c => c.MarketerPromotedProductsAnalyticsIndexComponent),
        title: "Promoted Products Analytics - Track promoter activity and storefront sales",
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
        path: ':storeId/products/edit/:productId',
        loadComponent: () => import('./marketer/products/edit-product/edit-product.component').then(m => m.EditProductComponent),
        title: "Update Store Product - Edit Product Information",
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

     {
        path: 'store/:storeId/products',
        loadComponent: () => import('./promoter/store-products-list/store-products-list.component').then(c => c.StoreProductsListComponent),
        title: "Store Products - Browse Published Products",
    },
    
    {
        path: 'promotions',
        loadComponent: () => import('./promoter/promoted-products').then(c => c.PromotionsIndexComponent),
        title: "Promoted Products - Affiliate Analytics",
    },
    
]
