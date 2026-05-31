import { Routes } from "@angular/router";

export const legalRoutes: Routes = [
    { 
        path: '', 
        //component: IndexComponent, 

        children: [
            { path: '', 
                loadComponent: () => import('./index').then(c => c.LegalIndexComponent),
                title: "MarketSpase Legal - Terms and conditions of website use",
                //redirectTo: 'terms',
                //pathMatch: 'prefix',
                children: [
                    { path: 'cookies', 
                        loadComponent: () => import('./cookies').then(c => c.CookiesIndexComponent),
                        title: "Legal - Cookies terms of use"
                    },
                    { path: 'terms', 
                        loadComponent: () => import('./terms').then(c => c.TermsIndexComponent),
                        title: "Legal - Terms of use"
                    },
                    { path: 'privacy', 
                        loadComponent: () => import('./privacy').then(c => c.PrivacyIndexComponent),
                        title: "Legal - Privacy terms of use"
                    },
                ]
            },
           

        ]
    },

]
