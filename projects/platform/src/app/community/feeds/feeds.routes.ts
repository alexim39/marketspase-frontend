import { Routes } from '@angular/router';

export const FeedsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./feed-page.component').then(c => c.FeedPageComponent),
    title: 'Feeds - Explore discussions, ask questions, and share knowledge',
  },
  {
    path: 'create',
    loadComponent: () => import('./create/create-feed.component').then(c => c.CreateFeedPageComponent),
    title: 'Create New Feed - Explore discussions, ask questions, and share knowledge',
  },


];
