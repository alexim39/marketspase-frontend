import { Routes } from "@angular/router";
import { AuthGuard } from "./guard.service";
import { DashboardIndexComponent } from "./index";
import { DashboardMainIndexComponent } from "./main-content";

export const dashboardRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: DashboardIndexComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                component: DashboardMainIndexComponent,
                pathMatch: 'full',
            },
            { 
                path: 'campaigns', 
                loadChildren: () => import('../campaign/campaign.routes').then(r => r.CampaignRoutes) 
            },
            { 
                path: 'stores', 
                loadChildren: () => import('../store/store.routes').then(r => r.StoreRoutes) 
            },
            { 
                path: 'settings', 
                loadChildren: () => import('../settings/settings.routes').then(r => r.SettingsRoutes) 
            },
            { 
                path: 'transactions', 
                loadChildren: () => import('../transactions/transactions.routes').then(r => r.TransactionsRoutes) 
            },
            { 
                path: 'home', 
                loadChildren: () => import('../home/home.routes').then(r => r.HomeRoutes) 
            },
            { 
                path: 'community', 
                loadChildren: () => import('../community/community.routes').then(r => r.CommunityRoutes) 
            },
            { 
                path: 'get-started', 
                loadChildren: () => import('../get-started/get-started.routes').then(r => r.GetStartedRoutes) 
            },
            { 
                path: 'profile', 
                loadChildren: () => import('../profile/profile-routes').then(r => r.ProfileRoutes) 
            },
            { 
                path: 'tutorials', 
                loadChildren: () => import('../tutorials/tutorials.routes').then(r => r.TutorialRoutes) 
            },
            { 
                path: 'assistant', 
                loadChildren: () => import('../ai-assistant/ai-assistant.routes').then(r => r.AssistantRoutes) 
            },
            { path: 'ads', loadChildren: () => import('../admin/admin.routes').then(r => r.AdminRoutes) 

            },
            {
                path: 'analytics',
                loadComponent: () => import('./analytics/index').then(c => c.UnifiedAnalyticsIndexComponent),
                title: 'Analytics — Unified Dashboard',
            },
            {
                path: 'marketer/hire',
                loadComponent: () => import('../engagement/hire/index').then(c => c.HirePromotersIndexComponent),
                title: 'Hire Promoters — Engagement Dashboard',
            },
            {
                path: 'promoter/feed',
                loadComponent: () => import('../engagement/promoter-feed/index').then(c => c.PromoterEngagementFeedIndexComponent),
                title: 'Engagement Feed — Promoter Dashboard',
            },
            {
                path: 'admin/disputes',
                loadComponent: () => import('../engagement/admin/admin-disputes.component').then(c => c.AdminDisputesComponent),
                title: 'Dispute Resolution — Admin',
            },
            {
                path: 'contracts',
                loadComponent: () => import('../engagement/contracts/index').then(c => c.EngagementContractsIndexComponent),
                title: 'Engagement Contracts',
            },
            {
                path: 'contracts/:id',
                loadComponent: () => import('../engagement/contracts/detail-index').then(c => c.EngagementContractDetailIndexComponent),
                title: 'Contract Details',
            },
            {
                path: 'leaderboard',
                loadComponent: () => import('./leaderboard').then(c => c.LeaderboardIndexComponent),
            },
            {
                path: 'gamification',
                loadComponent: () => import('./gamification').then(c => c.GamificationIndexComponent),
            },
            {
                path: 'search',
                loadComponent: () => import('./search').then(c => c.GlobalSearchIndexComponent),
            },
            {
                path: 'notifications',
                loadComponent: () => import('./notification/notification-center/index.component').then(c => c.NotificationCenterIndexComponent),
            },
            {
                path: 'messages',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('../messages').then(c => c.CampaignCollaborationIndexComponent),
                        data: { section: 'activity' },
                    },
                    {
                        path: 'inbox',
                        loadComponent: () => import('../messages').then(c => c.CampaignCollaborationIndexComponent),
                        data: { section: 'direct' },
                    },
                    {
                        path: 'groups',
                        loadComponent: () => import('../messages').then(c => c.CampaignCollaborationIndexComponent),
                        data: { section: 'rooms' },
                    },
                ],
            },
            // { path: 'settings', loadChildren: () => import('./settings/settings-routes').then(r => r.SettingsRoutes) },            
            // { path: 'support', loadChildren: () => import('./support/support-routes').then(r => r.SupportRoutes) },            
            // { path: 'business', loadChildren: () => import('./business/business-routes').then(r => r.BusinessRoutes) },            
            // { path: 'marketing', loadChildren: () => import('./marketing/marketing-routes').then(r => r.MarketingRoutes) },  
            // { path: 'analytics', loadChildren: () => import('./business/analytics/analytics-routes').then(r => r.AnalyticsRoutes) },
        ]
    },
]
