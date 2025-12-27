import { Routes } from "@angular/router";
import { AuthGuard } from "./guard.service";
import { DashboardIndexComponent } from "./index";
import { DashboardMainContainer } from "./main-content/main-content.component";

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
               component: DashboardMainContainer,
            },                    
            { path: 'campaigns', loadChildren: () => import('../campaign/campaign.routes').then(r => r.CampaignRoutes) },           
            { path: 'stores', loadChildren: () => import('../store/store.routes').then(r => r.StoreRoutes) },           
            { path: 'settings', loadChildren: () => import('../settings/settings.routes').then(r => r.SettingsRoutes) },           
            { path: 'transactions', loadChildren: () => import('../transactions/transactions.routes').then(r => r.TransactionsRoutes) },           
            { path: 'forum', loadChildren: () => import('../forum/forum.routes').then(r => r.ForumRoutes) },           
            // { path: 'settings', loadChildren: () => import('./settings/settings-routes').then(r => r.SettingsRoutes) },            
            // { path: 'support', loadChildren: () => import('./support/support-routes').then(r => r.SupportRoutes) },            
            // { path: 'business', loadChildren: () => import('./business/business-routes').then(r => r.BusinessRoutes) },            
            // { path: 'marketing', loadChildren: () => import('./marketing/marketing-routes').then(r => r.MarketingRoutes) },  
            // { path: 'analytics', loadChildren: () => import('./business/analytics/analytics-routes').then(r => r.AnalyticsRoutes) },
             
               
        ]
    },
]
