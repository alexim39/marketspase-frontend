import { Routes } from "@angular/router";
import { AuthGuard } from "./guard.service";
import { DashboardIndex } from "./index";

export const dashboardRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        component: DashboardIndex,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
               // component: DashboardIndexComponent,
                children: [
                   /*  { path: '', 
                        component: GetStartedComponent, 
                        title: "Diamond Project Online - Get trained to get financially free",
                    }, */
                   /*  {   path: 'search',
                        component: SearchResultContainerComponent, 
                        title: "Partners Search - Partners result details"
                    }, */
                    /* { path: 'get-involved', 
                        component: GettingInvolvedComponent, 
                        title: "Project Summary - Get involved as a member"
                    }, */
        
                ]
            }, 
                   
            // { path: 'payment', loadChildren: () => import('./payments/payment-routes').then(r => r.PaymentRoutes) },            
            // { path: 'settings', loadChildren: () => import('./settings/settings-routes').then(r => r.SettingsRoutes) },            
            // { path: 'support', loadChildren: () => import('./support/support-routes').then(r => r.SupportRoutes) },            
            // { path: 'business', loadChildren: () => import('./business/business-routes').then(r => r.BusinessRoutes) },            
            // { path: 'marketing', loadChildren: () => import('./marketing/marketing-routes').then(r => r.MarketingRoutes) },  
            // { path: 'analytics', loadChildren: () => import('./business/analytics/analytics-routes').then(r => r.AnalyticsRoutes) },  
               
        ]
    },
]
