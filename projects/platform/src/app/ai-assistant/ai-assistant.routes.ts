import { Routes } from "@angular/router";

export const AssistantRoutes: Routes = [
    {
        path: '',
        //component: AiAssistantShellComponent,
        loadComponent: () => import('./ai-assistant-shell.component').then(c => c.AiAssistantShellComponent),
        title: 'AI Assistant',
        /*  */
        children: [
            {
                path: '',
                redirectTo: 'overview', // Redirects the base URL to /onboarding
                pathMatch: 'full'
            },
            {
                path: 'overview',
                loadComponent: () => import('./pages/overview/overview.component').then(c => c.OverviewComponent),
                title: 'AI Assistant - Overview'
            },
            {
                path: 'conversations',
                loadComponent: () => import('./pages/conversations/conversations.component').then(c => c.ConversationsComponent),
                title: 'AI Assistant - Conversations'
            },
            {
                path: 'faqs',
                loadComponent: () => import('./pages/faqs/faqs.component').then(c => c.FaqsComponent),
                title: 'AI Assistant - FAQs'
            },
            {
                path: 'automation',
                loadComponent: () => import('./pages/automation/automation.component').then(c => c.AutomationComponent),
                title: 'AI Assistant - Automation'
            },
            {
                path: 'analytics',
                loadComponent: () => import('./pages/analytics/analytics.component').then(c => c.AnalyticsComponent),
                title: 'AI Assistant - Analytics' 
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings/settings.component').then(c => c.SettingsComponent),
                title: 'AI Assistant - Settings'
            }, 
        ]
    },
];
