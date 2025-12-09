import { Routes } from "@angular/router";
import { AuthGuard } from "./guard.service";
import { AdminDashboardComponent } from "./index.component";
import { DashboardMainComponent } from "./dashboard-main.component";

export const dashboardRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: AdminDashboardComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
               component: DashboardMainComponent,
            },   
            { path: 'users', loadChildren: () => import('../users/user.routes').then(r => r.UserRoutes) }, 
            {   path: 'campaigns', 
                loadComponent: () => import('../campaign/campaign.component').then(c => c.CampaignMgtComponent),
                title: 'Campaign Management - Admin Dashboard'
            },  
            { path: 'promotions', loadChildren: () => import('../promotion/promotion.routes').then(r => r.PromotionRoutes) },  
            { path: 'campaigns/:id', 
                loadComponent: () => import('../campaign/campaign-details/campaign-details.component').then(c => c.CampaignDetailsComponent),
                title: 'Campaign Details - Admin Dashboard'
            },
            { path: 'campaigns/:id/promotions', 
                loadComponent: () => import('../promotion/promotion.component').then(c => c.CampaignPromotionsComponent),
                title: 'Promotion Details - Admin Dashboard'
            },  
            {   path: 'testimonials', 
                loadComponent: () => import('../testimonial/testimonial.component').then(c => c.TestimonialMgtComponent),
                title: 'Testimonial Management - Admin Dashboard'
            }, 
            { path: 'financial', loadChildren: () => import('../financial/financial.routes').then(r => r.FinancialRoutes) },
            // {   path: 'financial', 
            //     loadComponent: () => import('../financial/financial-mgt.component').then(c => c.FinancialMgtComponent),
            //     title: 'Financial Management - Admin Dashboard'
            // }, 
            {   path: 'newletters', 
                loadComponent: () => import('../newsletter/newsletter.component').then(c => c.NewsletterManagementComponent),
                title: 'Newletters Management - Admin Dashboard'
            }, 
                              
            // { path: 'marketing', loadChildren: () => import('./marketing/marketing-routes').then(r => r.MarketingRoutes) },  
            // { path: 'analytics', loadChildren: () => import('./business/analytics/analytics-routes').then(r => r.AnalyticsRoutes) },  
               
        ]
    },
]
