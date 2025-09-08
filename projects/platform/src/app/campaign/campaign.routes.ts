import { Routes } from "@angular/router";
import { CampaignIndexComponent } from "./index";
import { CreateCampaignComponent } from "./create/create-campaign.component";
import { PromotionComponent } from "../promoter/promotion/promotion.component";

export const CampaignRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: CampaignIndexComponent,
        title: "Advertiser, Promoter Dashboard - Manage all campaign and promotion",
    },
    {
        path: 'create',
        component: CreateCampaignComponent,
        title: "Campaign Creation - Create New Campaign",
    }, 
    {
        path: 'my-promotions',
        component: PromotionComponent,
        title: "Promotions - List all accepted promoter promotions",
    }, 
    
]
