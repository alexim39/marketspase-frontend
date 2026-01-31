import { Routes } from "@angular/router";

export const legalRoutes: Routes = [
    { 
        path: '', 
        //component: IndexComponent, 

        children: [
            { path: '', 
                loadComponent: () => import('./legal.component').then(c => c.LegalComponent),
                title: "MarketSpase Legal - Terms and conditions of website use",
                //redirectTo: 'terms',
                //pathMatch: 'prefix',
                children: [
                    { path: 'cookies', 
                        loadComponent: () => import('./cookies/cookies.component').then(c => c.CookiesComponent),
                        title: "Legal - Cookies terms of use"
                    },
                    { path: 'terms', 
                        loadComponent: () => import('./terms/terms.component').then(c => c.TermsComponent),
                        title: "Legal - Terms of use"
                    },
                    { path: 'privacy', 
                        loadComponent: () => import('./privacy/privacy.component').then(c => c.PrivacyComponent),
                        title: "Legal - Privacy terms of use"
                    },
                ]
            },
           

        ]
    },

]
