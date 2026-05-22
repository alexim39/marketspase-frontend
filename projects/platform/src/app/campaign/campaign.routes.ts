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
        loadComponent: () => import('./create/create-campaign.component').then(c => c.CreateCampaignComponent),
        title: "Campaign Creation - Create New Campaign",
    }, 
    {
        path: 'promotions',
        loadComponent: () => import('../promoter/promotion/promotion.component').then(c => c.PromotionComponent),
        title: "Promotions - List all accepted promoter promotions",
    }, 
    {
        path: 'promotions/ad-builder',
        loadComponent: () => import('../promoter/promotion/ad-template-builder/ad-template-builder.component').then(c => c.AdTemplateBuilderComponent),
        title: "Ad Template Builder - Create social-ready promotions",
    },
    {
        path: 'analytics',
        loadComponent: () => import('./analytics/campaign-analytics.component').then(c => c.CampaignAnalyticsComponent),
        title: "Campaign Analytics - Live campaign and promotion performance",
    },
    {
        path: 'collaboration',
        loadComponent: () => import('./collaboration/collaboration.component').then(c => c.CampaignCollaborationComponent),
        title: "Collaboration - Real-time messaging for campaigns and promotions",
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./campaign-edit/campaign-edit.component').then(c => c.CampaignEditComponent),
        title: "Campaign Edit - Edit a campaign",
    },
    {
        path: ':id/targeting',
        loadComponent: () => import('./targeting/targeting.component').then(c => c.CampaignTargetingComponent),
        title: "Campaign Targeting - target your audience",
    },
    {
        path: ':id',
        loadComponent: () => import('./campaign-details/campaign-details.component').then(c => c.CampaignDetailsComponent),
        title: "Campaign Details - List all accepted promoter promotions",
    },
    {
        path: 'promotions/:id',
        loadComponent: () => import('../promoter/promotion/promotion-details/promotion-detail.component').then(c => c.PromotionDetailComponent),
        title: "Promotion Details - List all accepted promoter promotions",
    },
    
]
