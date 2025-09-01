import { Routes } from "@angular/router";
import { Index } from "./index";
import { CreateCampaignComponent } from "./create/create-campaign.component";

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
   /*  {
        path: 'all',
        component: CampaignListComponent,
        title: "List all Campaign",
    },  */
    
]
