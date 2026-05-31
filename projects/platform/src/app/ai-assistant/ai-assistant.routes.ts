import { Routes } from "@angular/router";

export const AssistantRoutes: Routes = [
    {
        path: 'customer',
        //component: AiAssistantShellComponent,
        loadComponent: () => import('./ai-assistant.component').then(c => c.AiAssistantComponent),
        title: 'AI Sales Assistant',
        /*  */
        children: [
            {
                path: '',
                redirectTo: 'overview', // Redirects the base URL to /onboarding
                pathMatch: 'full'
            },
            {
                path: 'overview',
                loadComponent: () => import('./pages/overview').then(c => c.OverviewIndexComponent),
                title: 'AI Sales Assistant - Overview'
            },
            {
                path: 'conversations',
                loadComponent: () => import('./pages/conversations').then(c => c.ConversationsIndexComponent),
                title: 'AI Sales Assistant - Conversations'
            },
            {
                path: 'faqs',
                loadComponent: () => import('./pages/faqs').then(c => c.FaqsIndexComponent),
                title: 'AI Sales Assistant - FAQs'
            },
            {
                path: 'automation',
                loadComponent: () => import('./pages/automation').then(c => c.AutomationIndexComponent),
                title: 'AI Sales Assistant - Automation'
            },
            {
                path: 'analytics',
                loadComponent: () => import('./pages/analytics').then(c => c.AnalyticsIndexComponent),
                title: 'AI Sales Assistant - Analytics' 
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings').then(c => c.AssistantSettingsIndexComponent),
                title: 'AI Sales Assistant - Settings'
            }, 
        ]
    },
];
