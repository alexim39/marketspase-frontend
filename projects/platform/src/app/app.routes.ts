import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./index/index').then(c => c.AppLandingIndexComponent), },
    { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(r => r.dashboardRoutes) },
    { path: 'resources', loadChildren: () => import('./resources/resources.routes').then(r => r.RosourcesRoutes) }, 
    { path: 'legal', loadChildren: () => import('./legal/legal.routes').then(r => r.legalRoutes) },
    { path: 'store/:storeLink', loadComponent: () => import('./storefront').then(c => c.StorefrontIndexComponent) },
    { path: 'cart', loadComponent: () => import('./storefront/cart').then(c => c.StorefrontCartIndexComponent) },
    { path: 'product/:productId', loadComponent: () => import('./storefront/product-details/main').then(m => m.ProductDetailsIndexComponent) },
    { path: 'campaigns/unavailable', loadComponent: () => import('./campaign/public-campaign-unavailable.component').then(c => c.PublicCampaignUnavailableComponent) },
    { path: 'feed/:postId', loadComponent: () => import('./community/feeds/public-feed-post.component').then(c => c.PublicFeedPostComponent) },
    { path: 'ref/:username', loadComponent: () => import('./referral/referral-capture.component').then(c => c.ReferralCaptureComponent) },
    { path: 'promote/:productId', loadComponent: () => import('./storefront/product-details/main').then(m => m.ProductDetailsIndexComponent) }

];
