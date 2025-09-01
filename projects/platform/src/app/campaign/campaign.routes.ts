import { Routes } from "@angular/router";
import { Index } from "./index";
import { CreateCampaignComponent } from "./create/create-campaign.component";
import { PromoterCampaignsComponent } from "../promoter-campaign/promoter-campaign.component";

export const CampaignRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: Index,
        title: "Advertiser Campaign Dashboard",
    },
    {
        path: 'create',
        component: CreateCampaignComponent,
        title: "Create New Campaign",
    }, 
    {
        path: 'my-promotions',
        component: PromoterCampaignsComponent,
        title: "List all accepted promotions/campaign",
    }, 
    
]
