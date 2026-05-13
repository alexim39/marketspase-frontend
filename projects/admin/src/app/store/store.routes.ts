import { Routes } from "@angular/router";

export const StoreRoutes: Routes = [

    {   path: '', 
        loadComponent: () => import('../store/store-management/store-management.component').then(c => c.StoreManagementComponent),
        title: 'Stores Management - Admin Dashboard'
    }, 
    {
        path: 'reviews',
        loadComponent: () => import('../store/reviews/store-review-moderation.component').then(c => c.StoreReviewModerationComponent),
        title: 'Product Review Moderation - Admin Dashboard'
    },
    {
        path: 'delivery-releases',
        loadComponent: () => import('../store/releases/storefront-release-requests.component').then(c => c.StorefrontReleaseRequestsComponent),
        title: 'Delivery Release Requests - Admin Dashboard'
    },
    {
        path: 'products/:storeId',
        loadComponent: () => import('../store/products/store-products.component').then(c => c.StoreProductsComponent),
        title: "Store Products - Store Management",
    }, 
   
    
]
