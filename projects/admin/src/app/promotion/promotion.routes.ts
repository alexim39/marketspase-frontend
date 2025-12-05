import { Routes } from "@angular/router";
import { PendingPromotionListMgtComponent, } from "./submitted-promotion-list/submitted-promotion-list.component";
import { AllPromotionListMgtComponent } from "./all-promotion-list/all-promotion-list.component";
// import { CampaignIndexComponent } from "./index";
// import { CreateCampaignComponent } from "./create/create-campaign.component";
// import { PromotionComponent } from "../promoter/promotion/promotion.component";
// import { CampaignDetailsComponent } from "./campaign-details/campaign-details.component";
// import { CampaignEditComponent } from "./campaign-edit/campaign-edit.component";
// import { PromotionDetailComponent } from "../promoter/promotion/promotion-details/promotion-detail.component";

export const PromotionRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: AllPromotionListMgtComponent,
        title: 'Promotions Management - Admin Dashboard'
    },
    {
        path: 'submitted',
        component: PendingPromotionListMgtComponent,
        title: "Submitted Promotions - List all submitted promotions",
    }, 
    // {
    //     path: 'promotions',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
    // {
    //     path: 'edit/:id',
    //     component: CampaignEditComponent,
    //     title: "Campaign Edit - Edit a campaign",
    // },
    // {
    //     path: ':id',
    //     component: CampaignDetailsComponent,
    //     title: "Campaign Details - List all accepted promoter promotions",
    // },
    // {
    //     path: 'promotions/:id',
    //     component: PromotionDetailComponent,
    //     title: "Promotion Details - List all accepted promoter promotions",
    // },
    
]
