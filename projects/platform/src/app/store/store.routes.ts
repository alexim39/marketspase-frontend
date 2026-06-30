import { Routes } from "@angular/router";

export const StoreRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('.').then(c => c.StoreIndexComponent),
        title: "Store Dashboard - View and Manage all store",
    },

    {
        path: 'offerings',
        loadComponent: () => import('./promoter/products-list').then(c => c.PromoterProductsListIndexComponent),
        title: "Browse to Promote — Products & Services",
    },
    {
        path: 'products',
        redirectTo: 'offerings',
        pathMatch: 'full',
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
        path: ':storeId/services',
        loadComponent: () => import('./marketer/services/service-list-management/service-list-management.component').then(c => c.ServiceListManagementComponent),
        title: 'Service Management — MarketSpase',
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

    {
        path: 'services/create/:storeId',
        loadComponent: () => import('./marketer/services/create-service/create-service.component').then(c => c.CreateServiceComponent),
        title: 'Create Service — MarketSpase',
    },
    {
        path: 'services/subscribe/:storeId',
        loadComponent: () => import('./marketer/services/service-subscription/service-subscription.component').then(c => c.ServiceSubscriptionComponent),
        title: 'Service Subscription — MarketSpase',
    },
    {
        path: 'services/:storeId',
        loadComponent: () => import('./marketer/services/create-service/create-service.component').then(c => c.CreateServiceComponent),
        title: 'Manage Services — MarketSpase',
    },
    {
        path: ':storeId',
        redirectTo: '',
    },
]
