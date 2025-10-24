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
            {   path: 'users', 
                loadComponent: () => import('../users/users.component').then(c => c.UserMgtComponent),
                title: 'User Management - Admin Dashboard'
            },  
            { path: 'users/:id', 
                loadComponent: () => import('../users/user-details/user-details.component').then(c => c.UserDetailsComponent),
                title: 'User Details - Admin Dashboard'
            },
            {   path: 'campaigns', 
                loadComponent: () => import('../campaign/campaign.component').then(c => c.CampaignMgtComponent),
                title: 'Campaign Management - Admin Dashboard'
            },   
            {   path: 'promotions', 
                loadComponent: () => import('../promotion/promotion-list/promotion-list.component').then(c => c.PromotionListMgtComponent),
                title: 'Promotions Management - Admin Dashboard'
            },   
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
                              
            // { path: 'marketing', loadChildren: () => import('./marketing/marketing-routes').then(r => r.MarketingRoutes) },  
            // { path: 'analytics', loadChildren: () => import('./business/analytics/analytics-routes').then(r => r.AnalyticsRoutes) },  
               
        ]
    },
]
