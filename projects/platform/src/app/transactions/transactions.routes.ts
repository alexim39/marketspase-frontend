import { Routes } from "@angular/router";

export const TransactionsRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./').then(c => c.TransactionsIndexComponent),
        title: "Transactions for Marketer, Promoter  - View all transaction details",
    },
    {
        path: 'withdrawal',
        loadComponent: () => import('../wallet/withdrawal/withdrawal.component').then(c => c.WithdrawalComponent),
        title: "Withfrawl Transanction - Request fund withdrawal",
    }, 
    // {
    //     path: 'promotions',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
    
]