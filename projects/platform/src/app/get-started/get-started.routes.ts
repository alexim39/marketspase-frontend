import { Routes } from "@angular/router";
import { GetStartedComponent } from "./onboarding/get-started.component";

export const GetStartedRoutes: Routes = [
    {
        path: '',
        redirectTo: 'onboarding', // Redirects the base URL to /onboarding
        pathMatch: 'full'
    },
    {
        path: 'onboarding',
        component: GetStartedComponent,
        title: "Get Started - Onboarding process",
    },
    // {
    //     path: 'storefront-guide',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
];
