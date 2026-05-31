import { Routes } from "@angular/router";
import { ResourcesIndexComponent } from "./index.component";

export const RosourcesRoutes: Routes = [
    { 
        path: '', 
        component: ResourcesIndexComponent, 
        children: [
            {
                path: '', 
                redirectTo: 'about', 
                pathMatch: 'full'
            },
            {   path: 'about', 
                loadComponent: () => import('./about').then(c => c.AboutIndexComponent),
                title: "About Us - Get to know us",
            },
            {
                path: 'contact',
                loadComponent: () => import('./contact').then(m => m.ContactIndexComponent),
                title: "Contact Us - Get to meet us",
            },
            {
                path: 'features',
                loadComponent: () => import('./features').then(m => m.FeaturesIndexComponent),
                title: "Features - Explore our features",
            },
            {
                path: 'success-stories',
                loadComponent: () => import('./success-stories').then(m => m.SuccessStoriesIndexComponent),
                title: "Success Stories - Our customer stories",
            },
            {
                path: 'community',
                loadComponent: () => import('./community').then(m => m.CommunityIndexComponent),
                title: "Community - Join our community",
            },
            {
                path: 'help-center',
                loadComponent: () => import('./help-center').then(m => m.HelpCenterIndexComponent),
                title: "Help Center - Get support and find answers",
            },
            {
                path: 'how-it-works',
                loadComponent: () => import('./how-it-works').then(m => m.HowItWorksIndexComponent),
                title: "How It Works - MarketSpase flow",
            },
            {
                path: 'benefits',
                loadComponent: () => import('./benefits').then(m => m.BenefitsIndexComponent),
                title: "Benefits - Why choose MarketSpase",
            },
            {
                path: 'faqs',
                loadComponent: () => import('./faq').then(m => m.FAQIndexComponent),
                title: "FAQs - Frequently Asked Questions",
            },
            {
                path: 'careers',
                loadComponent: () => import('./career').then(m => m.CareersIndexComponent),
                title: "Careers - Join our team",
            },
            {
                path: 'solutions',
                children: [
                    {   path: 'marketers', 
                        loadComponent: () => import('./for-marketers').then(c => c.ForMarketersIndexComponent),
                        title: "Marketers information Guideline - MarketSpase",
                    },
                    {   path: 'promoters', 
                        loadComponent: () => import('./for-promoters').then(c => c.ForPromotersIndexComponent),
                        title: "Promoters information Guideline - MarketSpase",
                    }
                ]
            }
           
           

        ]
    },

]
