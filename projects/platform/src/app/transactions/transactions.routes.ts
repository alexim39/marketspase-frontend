import { Routes } from "@angular/router";

export const TransactionsRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./').then(c => c.TransactionsIndexComponent),
        title: "Transactions for Marketer, Promoter  - View all transaction details",
    },
    {
        path: 'withdrawal',
        loadComponent: () => import('../wallet/withdrawal').then(c => c.WithdrawalIndexComponent),
        title: "Withdrawal Transanction - Request fund withdrawal",
    }, 
    {
        path: 'transfer',
        loadComponent: () => import('../wallet/transfer').then(c => c.TransferFundsIndexComponent),
        title: "Transfer Transanction - Request fund transfer",
    }, 
    // {
    //     path: 'promotions',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
    
]
