import { Routes } from "@angular/router";
import { TransactionsIndexComponent } from ".";
import { WithdrawalComponent } from "../wallet/withdrawal/withdrawal.component";

export const TransactionsRoutes: Routes = [
    {
        path: '',
        component: TransactionsIndexComponent,
        title: "Advertiser, Promoter Transactions - View all transaction details",
    },
    {
        path: 'withdrawal',
        component: WithdrawalComponent,
        title: "Withfrawl Transanction - Request fund withdrawal",
    }, 
    // {
    //     path: 'promotions',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
    
]