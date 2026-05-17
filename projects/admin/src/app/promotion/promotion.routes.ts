import { Routes } from "@angular/router";

export const PromotionRoutes: Routes = [

    {   path: '', 
        loadComponent: () => import('./all-promotion-list/all-promotion-list.component').then(c => c.AllPromotionListMgtComponent),
        title: 'Promotions Management - Admin Dashboard',
        pathMatch: 'full'
    }, 
    {
        path: 'fraud',
        loadComponent: () => import('./promotion-fraud-monitor/promotion-fraud-monitor.component').then(c => c.PromotionFraudMonitorComponent),
        title: 'Promotion Fraud Monitor - Admin Dashboard'
    },
    {
        path: 'submitted',
        loadComponent: () => import('./promotion-mgt/submitted-promotion-list/submitted-promotion-list.component').then(c => c.SubmittedPromotionListComponent),
        title: "Submitted Promotions - List all submitted promotions",
    }, 
   
    
]
