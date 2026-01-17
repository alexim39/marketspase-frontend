import { Routes } from "@angular/router";
import { GetStartedComponent } from "./get-started.component";

export const GetStartedRoutes: Routes = [
    {
        path: '',
        component: GetStartedComponent,
        title: "Get Started - Onboarding process",
    },
    // {
    //     path: 'withdrawal',
    //     component: WithdrawalComponent,
    //     title: "Withfrawl Transanction - Request fund withdrawal",
    // }, 
    // {
    //     path: 'promotions',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
    
]