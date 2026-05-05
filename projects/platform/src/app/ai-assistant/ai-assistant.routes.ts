import { Routes } from "@angular/router";

export const AssistantRoutes: Routes = [
    {
        path: 'customer',
        //component: AiAssistantShellComponent,
        loadComponent: () => import('./ai-assistant.component').then(c => c.AiAssistantComponent),
        title: 'AI WhatsApp Customer Assistant',
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
                title: 'AI WhatsApp Customer Assistant - Overview'
            },
            {
                path: 'conversations',
                loadComponent: () => import('./pages/conversations/conversations.component').then(c => c.ConversationsComponent),
                title: 'AI WhatsApp Customer Assistant - Conversations'
            },
            {
                path: 'faqs',
                loadComponent: () => import('./pages/faqs/faqs.component').then(c => c.FaqsComponent),
                title: 'AI WhatsApp Customer Assistant - FAQs'
            },
            {
                path: 'automation',
                loadComponent: () => import('./pages/automation/automation.component').then(c => c.AutomationComponent),
                title: 'AI WhatsApp Customer Assistant - Automation'
            },
            {
                path: 'analytics',
                loadComponent: () => import('./pages/analytics/analytics.component').then(c => c.AnalyticsComponent),
                title: 'AI WhatsApp Customer Assistant - Analytics' 
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings/settings.component').then(c => c.SettingsComponent),
                title: 'AI WhatsApp Customer Assistant - Settings'
            }, 
        ]
    },
];
