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
        loadComponent: () => import('./marketer/customer-support').then(c => c.CustomerSupportIndexComponent),
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
        loadComponent: () => import('./marketer/store-create').then(c => c.StoreCreateIndexComponent),
        title: "Create New Store - Setup your Marketer Store",
    }, 
   
    { 
        path: 'edit/:id', 
        loadComponent: () => import('./marketer/edit-store').then(c => c.StoreEditIndexComponent),
        title: "Edit Store - Update Store Information",
    }, 

    {
        path: 'product/:productId',
        loadComponent: () => import('./promoter/product-detail').then(c => c.PromoterProductDetailIndexComponent),
        title: "Product Details - View Product Information",
    }, 

    {
        path: ':storeId/products/create',
        loadComponent: () => import('./marketer/products/add-products').then(c => c.AddProductIndexComponent),
        title: "Add New Product - Create Product for Store",
    },

    {
        path: ':storeId/products/edit/:productId',
        loadComponent: () => import('./marketer/products/edit-product').then(m => m.EditProductIndexComponent),
        title: "Update Store Product - Edit Product Information",
    },

    {
        path: ':storeId/products',
        loadComponent: () => import('./marketer/products/product-list').then(c => c.MarketerProductListIndexComponent),
        title: "Product List - View and Manage Store Products",
    },

    {
        path: ':storeId/products/:productId',
        loadComponent: () => import('./marketer/products/product-detail').then(c => c.MarketerProductDetailIndexComponent),
        title: "Product Details - View and Manage Product Information",
    },

     {
        path: 'store/:storeId/products',
        loadComponent: () => import('./promoter/store-products-list').then(c => c.StoreProductsListIndexComponent),
        title: "Store Products - Browse Published Products",
    },
    
        {
        path: 'promotions',
        loadComponent: () => import('./promoter/promoted-products').then(c => c.PromotionsIndexComponent),
        title: "Promoted Products - Affiliate Analytics",
    },

        {
        path: 'discover-promoters',
        loadComponent: () => import('./marketer/promoter-discovery').then(c => c.PromoterDiscoveryIndexComponent),
        title: "Discover Promoters - Find top affiliates for your products",
    },

        {
        path: 'collections',
        loadComponent: () => import('./promoter/collections').then(c => c.PromoterCollectionsIndexComponent),
        title: "My Collections - Curated Product Collections",
    },
        {
        path: 'collections/create',
        loadComponent: () => import('./promoter/collections').then(c => c.PromoterCollectionsCreateIndexComponent),
        title: "Create Collection",
    },
        {
        path: 'collections/:id',
        loadComponent: () => import('./promoter/collections').then(c => c.PromoterCollectionsDetailIndexComponent),
        title: "Collection Details",
    },

        {
        path: 'contacts',
        loadChildren: () => import('./marketer/contacts/contacts.routes').then(r => r.ContactsRoutes),
    },
    
]
