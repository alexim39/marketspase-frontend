import { Routes } from '@angular/router';

export const FeedsRoutes: Routes = [
  {
      path: '',
      loadComponent: () => import('./index').then(c => c.FeedIndexComponent),
      title: "Feeds - Explore discussions, ask questions, and share knowledge",
  },
  {
    path: 'create',
    loadComponent: () => import('./create').then(c => c.CreateFeedIndexComponent),
    title: 'Create New Feed - Explore discussions, ask questions, and share knowledge',
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./create').then(c => c.CreateFeedIndexComponent),
    data: { title: 'Edit Post' }
  }


];
