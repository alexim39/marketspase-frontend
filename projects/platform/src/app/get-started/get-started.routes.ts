import { Routes } from "@angular/router";

export const GetStartedRoutes: Routes = [
    {
        path: '',
        redirectTo: 'onboarding', // Redirects the base URL to /onboarding
        pathMatch: 'full'
    },
    {
        path: 'onboarding',
        loadComponent: () => import('./onboarding').then(c => c.GetStartedIndexComponent),
        title: "Get Started - Onboarding process",
    },
    // {
    //     path: 'storefront-guide',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
];
