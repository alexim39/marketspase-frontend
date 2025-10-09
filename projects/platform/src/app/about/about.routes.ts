import { Routes } from "@angular/router";
import { AboutIndexComponent } from "./index.component";

export const AboutRoutes: Routes = [
    { 
        path: '', 
        component: AboutIndexComponent, 
        children: [
            {   path: '', 
                loadComponent: () => import('./about.component').then(c => c.AboutComponent),
                title: "About Us - Get to know us",
                //redirectTo: 'terms',
                //pathMatch: 'prefix',
                // children: [
                //     { path: 'cookies', 
                //         component: CookiesComponent, 
                //         title: "Legal - Cookies terms of use"
                //     },
                //     { path: 'terms', 
                //         component: TermsComponent, 
                //         title: "Legal - Terms of use"
                //     },
                //     { path: 'privacy', 
                //         component: PrivacyComponent, 
                //         title: "Legal - Privacy terms of use"
                //     },
                // ]
            },
            {
                path: 'contact',
                loadComponent: () => import('./contact/contact.component').then(m => m.ContactComponent),
                title: "Contact Us - Get to meet us",
            },
            {
                path: 'features',
                loadComponent: () => import('./features/features.component').then(m => m.FeaturesComponent),
                title: "Features - Explore our features",
            },
            {
                path: 'success-stories',
                loadComponent: () => import('./success-stories/success-stories.component').then(m => m.SuccessStoriesComponent),
                title: "Success Stories - Our customer stories",
            },
            {
                path: 'help-center',
                loadComponent: () => import('./help-center/help-center.component').then(m => m.HelpCenterComponent),
                title: "Help Center - Get support and find answers",
            },
            {
                path: 'how-it-works',
                loadComponent: () => import('./how-it-works/how-it-works.component').then(m => m.HowItWorksComponent),
                title: "Help Center - Get support and find answers",
            },
            {
                path: 'faqs',
                loadComponent: () => import('./faq/faq.component').then(m => m.FAQComponent),
                title: "FAQs - Frequently Asked Questions",
            },
            {
                path: 'careers',
                loadComponent: () => import('./career/career.component').then(m => m.CareersComponent),
                title: "careers - Join our team",
            },
            {
                path: 'solutions',
                children: [
                    {   path: 'marketers', 
                        loadComponent: () => import('./for-marketers/for-marketers.component').then(c => c.ForMarketersComponent),
                        title: "Martketers information Guideline - MarketSpase",
                    },
                    {   path: 'promoters', 
                        loadComponent: () => import('./for-promoters/for-promoters.component').then(c => c.ForPromotersComponent),
                        title: "Promoters information Guideline - MarketSpase",
                    }
                ]
            }
           
           

        ]
    },

]
