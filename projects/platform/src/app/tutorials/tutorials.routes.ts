import { Routes } from "@angular/router";

export const TutorialRoutes: Routes = [
    {
        path: '',
        redirectTo: 'videos', // Redirects the base URL to /onboarding
        pathMatch: 'full'
    },
    {
        path: 'videos',
        loadComponent: () => import('./index').then(c => c.TutorialsIndexComponent),
        title: "Get Started - Onboarding process",
    },
    // {
    //     path: 'storefront-guide',
    //     component: PromotionComponent,
    //     title: "Promotions - List all accepted promoter promotions",
    // }, 
];
