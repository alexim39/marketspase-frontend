import { Routes } from "@angular/router";
import { FinancialMgtComponent } from "./financial-mgt.component";
import { RefundComponent } from "./refund/refund.component";
// import { SubmittedPromotionListComponent, } from "./submitted-promotion-list/submitted-promotion-list.component";
// import { AllPromotionListMgtComponent } from "./all-promotion-list/all-promotion-list.component";

export const FinancialRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: FinancialMgtComponent,
        title: 'Financial Management - Admin Dashboard'
    },
    {
        path: 'refunds',
        component: RefundComponent,
        title: "Refund Management - Financial Dashboard",
    }, 
   
    
]
