import { Routes } from "@angular/router";
import { Index } from "./index";
import { CreateCampaignComponent } from "./create/create-campaign.component";
import { PromoterPromotionComponent } from "../promoter/promoter-campaign/promotion.component";

export const CampaignRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: Index,
        title: "Advertiser, Promoter Dashboard - Manage all campaign and promotion",
    },
    {
        path: 'create',
        component: CreateCampaignComponent,
        title: "Campaign Creation - Create New Campaign",
    }, 
    {
        path: 'my-promotions',
        component: PromoterPromotionComponent,
        title: "Promotions - List all accepted promoter promotions",
    }, 
    
]
