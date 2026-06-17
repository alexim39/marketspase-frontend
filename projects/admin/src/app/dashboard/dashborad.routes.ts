import { Routes } from "@angular/router";
import { AuthGuard } from "./guard.service";
import { AdminDashboardComponent } from "./index.component";
import { DashboardMainComponent } from "./dashboard-main.component";

export const dashboardRoutes: Routes = [
    {
        path: '',
        component: AdminDashboardComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
               component: DashboardMainComponent,
            },   
            { 
                path: 'users', 
                loadChildren: () => import('../users/user.routes').then(r => r.UserRoutes),
                title: 'User Management - Admin Dashboard'
            }, 
            {   path: 'campaigns', 
                loadComponent: () => import('../campaign/campaign.component').then(c => c.CampaignMgtComponent),
                title: 'Campaign Management - Admin Dashboard'
            },  
            {   path: 'promotions', 
                loadChildren: () => import('../promotion/promotion.routes').then(r => r.PromotionRoutes),
                title: 'Promotion Management - Admin Dashboard'
            },  
            {   
                path: 'campaigns/:id', 
                loadComponent: () => import('../campaign/campaign-details/campaign-details.component').then(c => c.CampaignDetailsComponent),
                title: 'Campaign Details - Admin Dashboard'
            },
            {   path: 'campaigns/:id/promotions', 
                loadComponent: () => import('../promotion/promotion.component').then(c => c.CampaignPromotionsComponent),
                title: 'Promotion Details - Admin Dashboard'
            },  
            {   path: 'testimonials', 
                loadComponent: () => import('../testimonial/testimonial.component').then(c => c.TestimonialMgtComponent),
                title: 'Testimonial Management - Admin Dashboard'
            }, 
            { 
                path: 'financial', 
                loadChildren: () => import('../financial/financial.routes').then(r => r.FinancialRoutes),
                title: 'Financial Management - Admin Dashboard'
            }, 
            {   path: 'newletters', 
                loadComponent: () => import('../newsletter/newsletter.component').then(c => c.NewsletterManagementComponent),
                title: 'Newletters Management - Admin Dashboard'
            }, 
            {   path: 'newsletters',
                redirectTo: 'newletters',
                pathMatch: 'full'
            },
            { 
                path: 'stores', 
                loadChildren: () => import('../store/store.routes').then(r => r.StoreRoutes),
                title: 'Store Management - Admin Dashboard'
            },
            {
                path: 'community',
                loadComponent: () => import('./community-ops.component').then(c => c.CommunityOpsComponent),
                title: 'Community Operations - Admin Dashboard'
            },
            {
               path: 'posts',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('../posts/post-list.component').then(c => c.AdminPostListComponent),
                        title: 'Post Management - Admin Dashboard'
                    },
                    {
                        path: 'spotlight',
                        loadComponent: () => import('../posts/spotlight-mgt/spotlight-mgt.component').then(c => c.SpotlightManagementComponent),
                        title: 'Spotlight Rotation - Admin Dashboard'
                    },
                    {
                        path: ':postId',
                        loadComponent: () => import('../posts/post-detail/post-detail.component').then(c => c.AdminPostDetailComponent),
                        title: 'Post Details - Admin Dashboard'
                    },
                ]
            },      
           {
               path: 'settings',
                children: [
                    {
                        path: '',
                        redirectTo: 'payments',
                        pathMatch: 'full'
                    },
                    {
                        path: 'payments',
                        loadComponent: () => import('../settings/payment-settings.component').then(c => c.PaymentSettingsComponent),
                        title: 'Payment Settings - Admin Dashboard'
                    },
                    {
                        path: 'login-streaks',
                        loadComponent: () => import('../settings/login-streak-settings.component').then(c => c.LoginStreakSettingsComponent),
                        title: 'Daily Login Streak Settings - Admin Dashboard'
                    },
                    {
                        path: 'badges',
                        loadComponent: () => import('../settings/badge-settings.component').then(c => c.BadgeSettingsComponent),
                        title: 'Badge & Level Settings - Admin Dashboard'
                    },
                    {
                        path: 'gamification',
                        loadComponent: () => import('../settings/gamification-settings.component').then(c => c.GamificationSettingsComponent),
                        title: 'Gamification Settings - Admin Dashboard'
                    },
                    {
                        path: 'ppc-pricing',
                        loadComponent: () => import('../settings/ppc-pricing-settings.component').then(c => c.PpcPricingSettingsComponent),
                        title: 'PPC Pricing Settings - Admin Dashboard'
                    },
                ]
           }
            
        // { path: 'marketing', loadChildren: () => import('./marketing/marketing-routes').then(r => r.MarketingRoutes) },
        // { path: 'analytics', loadChildren: () => import('./business/analytics/analytics-routes').then(r => r.AnalyticsRoutes) },
        ]
    },
]

