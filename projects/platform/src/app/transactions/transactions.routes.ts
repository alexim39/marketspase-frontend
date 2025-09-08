import { Routes } from "@angular/router";
import { TransactionsIndexComponent } from ".";

export const TransactionsRoutes: Routes = [
    {
        path: '',
        component: TransactionsIndexComponent,
        title: "Advertiser, Promoter Transactions - View all transaction details",
    },
    // {
    //     path: 'create',
    //     component: CreateCampaignComponent,
    //     title: "Campaign Creation - Create New Campaign",
    // }, 
    // {
    //     path: 'my-promotions',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
    
]