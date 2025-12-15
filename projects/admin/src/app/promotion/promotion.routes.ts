import { Routes } from "@angular/router";
import { SubmittedPromotionListComponent, } from "./promotion-mgt/submitted-promotion-list/submitted-promotion-list.component";
import { AllPromotionListMgtComponent } from "./all-promotion-list/all-promotion-list.component";

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
        component: SubmittedPromotionListComponent,
        title: "Submitted Promotions - List all submitted promotions",
    }, 
   
    
]
