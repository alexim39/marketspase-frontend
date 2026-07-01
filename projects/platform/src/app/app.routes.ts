import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', loadComponent: () => import('./index/index').then(c => c.AppLandingIndexComponent), },
    { path: 'dashboard', loadChildren: () => import('./dashboard/dashboard.routes').then(r => r.dashboardRoutes) },
    { path: 'resources', loadChildren: () => import('./resources/resources.routes').then(r => r.RosourcesRoutes) }, 
    { path: 'legal', loadChildren: () => import('./legal/legal.routes').then(r => r.legalRoutes) },
    { path: 'store/:storeLink/inquiry/:serviceId', loadComponent: () => import('./storefront/components/service-inquiry-page/service-inquiry-page.component').then(c => c.ServiceInquiryPageComponent) },
    { path: 'track-order', loadComponent: () => import('./storefront/components/track-order/track-order.component').then(c => c.TrackOrderComponent) },
    { path: 'store/:storeLink', loadComponent: () => import('./storefront').then(c => c.StorefrontIndexComponent) },
    { path: 'cart', loadComponent: () => import('./storefront/cart').then(c => c.StorefrontCartIndexComponent) },
    { path: 'product/:productId', loadComponent: () => import('./storefront/product-details/main').then(m => m.ProductDetailsIndexComponent) },
    { path: 'campaigns/unavailable', loadComponent: () => import('./campaign/public-campaign-unavailable').then(c => c.PublicCampaignUnavailableIndexComponent) },
    { path: 'feed/:postId', loadComponent: () => import('./community/feeds/public-feed-post').then(c => c.PublicFeedPostIndexComponent) },
    { path: 'ref/:username', loadComponent: () => import('./referral').then(c => c.ReferralCaptureIndexComponent) },
    { path: 'promote/:productId', loadComponent: () => import('./storefront/product-details/main').then(m => m.ProductDetailsIndexComponent) },
    { path: 'c/:upi', loadComponent: () => import('./campaign/public-campaign').then(c => c.PublicCampaignIndexComponent) },
    { path: '**', loadComponent: () => import('./shared/components/not-found/not-found.component').then(c => c.NotFoundComponent) },

];
