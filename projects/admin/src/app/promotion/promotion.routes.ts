import { Routes } from "@angular/router";

export const PromotionRoutes: Routes = [

    {   path: '', 
        loadComponent: () => import('./all-promotion-list/all-promotion-list.component').then(c => c.AllPromotionListMgtComponent),
        title: 'Promotions Management - Admin Dashboard',
        pathMatch: 'full'
    }, 
    {
        path: 'ppc-analytics',
        loadComponent: () => import('./ppc-analytics/ppc-analytics.component').then(c => c.PpcAnalyticsComponent),
        title: 'PPC Analytics - Admin Dashboard'
    },
    {
        path: 'fraud',
        loadComponent: () => import('./promotion-fraud-monitor/promotion-fraud-monitor.component').then(c => c.PromotionFraudMonitorComponent),
        title: 'Promotion Fraud Monitor - Admin Dashboard'
    }, 
   
    
]
