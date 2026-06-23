import { Routes } from "@angular/router";

export const CampaignRoutes: Routes = [
    {
        /* path: '',
        redirectTo: 'partner',
        pathMatch: 'full' */
        path: '',
        loadComponent: () => import('./index').then(c => c.CampaignIndexComponent),
        title: "Marketer, Promoter Dashboard - Manage all campaign and promotion",
    },
    {
        path: 'create',
        loadComponent: () => import('./create').then(c => c.CreateCampaignIndexComponent),
        title: "Campaign Creation - Create New Campaign",
    }, 
    {
        path: 'promotions',
        children: [
           {
                path: '',
                loadComponent: () => import('../promoter/promotion').then(c => c.PromotionIndexComponent),
                title: "Promotions - List all accepted promoter promotions",
           },
           {
                path: 'metrics',
                children: [
                    { path: '', loadComponent: () => import('../promoter/promotion/metrics').then(c => c.PromoterMetricsIndexComponent), title: "Promoter Metrics - Promotion performance analytics" },
                    { path: ':campaignId', loadComponent: () => import('../promoter/promotion/metrics/promoter-metrics-detail').then(c => c.PromoterMetricsDetailIndexComponent), title: "Promoter Metrics Detail - Per-campaign analytics" },
                ],
           },
           {
                path: 'ad-builder',
                loadComponent: () => import('../promoter/promotion/ad-template-builder/ad-template-builder.component').then(c => c.AdTemplateBuilderComponent),
                title: "Ad Template Builder - Create social-ready promotions",
            },
            {
                path: 'compliance',
                loadComponent: () => import('../promoter/promotion/compliance/promotion-compliance.component').then(c => c.PromotionComplianceComponent),
                title: "Account Health - Promotion compliance and fraud status",
            },
             {
                path: ':id',
                loadComponent: () => import('../promoter/promotion/promotion-details/promotion-detail.component').then(c => c.PromotionDetailComponent),
                title: "Promotion Details - List all accepted promoter promotions",
            },
        ]
        
    }, 
    
    {
        path: 'analytics',
        loadComponent: () => import('./analytics').then(c => c.CampaignAnalyticsIndexComponent),
        title: "Campaign Analytics - Live campaign and promotion performance",
    },
    {
        path: 'metrics',
        children: [
            {
                path: '',
                loadComponent: () => import('./metrics').then(c => c.CampaignMetricsIndexComponent),
                title: "Campaign Metrics - Lead performance and conversion funnel",
            },
            {
                path: ':campaignId',
                loadComponent: () => import('./metrics/campaign-metrics-detail').then(c => c.CampaignMetricsDetailIndexComponent),
                title: "Campaign Metrics Detail - Lead analytics per campaign",
            },
        ],
    },
    {
        path: 'collaboration',
        loadComponent: () => import('./collaboration').then(c => c.CampaignCollaborationIndexComponent),
        title: "Collaboration - Real-time messaging for campaigns and promotions",
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./campaign-edit').then(c => c.CampaignEditIndexComponent),
        title: "Campaign Edit - Edit a campaign",
    },
    {
        path: ':id/targeting',
        loadComponent: () => import('./targeting').then(c => c.CampaignTargetingIndexComponent),
        title: "Campaign Targeting - target your audience",
    },
    {
        path: ':id',
        loadComponent: () => import('./campaign-details').then(c => c.CampaignDetailsIndexComponent),
        title: "Campaign Details - List all accepted promoter promotions",
    },
   
    
]
