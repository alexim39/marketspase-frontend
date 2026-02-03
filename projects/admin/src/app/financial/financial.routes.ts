import { Routes } from "@angular/router";

export const FinancialRoutes: Routes = [

    {   path: '', 
        loadComponent: () => import('./financial-mgt.component').then(c => c.FinancialMgtComponent),
        title: 'Financial Management - Admin Dashboard'
    }, 
    {
        path: 'refunds',
        loadComponent: () => import('./refund/refund.component').then(c => c.RefundComponent),
        title: "Refund Management - Financial Dashboard",
    }, 
   
    
]
