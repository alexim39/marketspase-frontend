import { Routes } from "@angular/router";

export const PromotionRoutes: Routes = [

    {   path: '', 
        loadComponent: () => import('./all-promotion-list/all-promotion-list.component').then(c => c.AllPromotionListMgtComponent),
        title: 'Promotions Management - Admin Dashboard'
    }, 
    {
        path: 'submitted',
        loadComponent: () => import('./promotion-mgt/submitted-promotion-list/submitted-promotion-list.component').then(c => c.SubmittedPromotionListComponent),
        title: "Submitted Promotions - List all submitted promotions",
    }, 
   
    
]
