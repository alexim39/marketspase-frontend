import { Routes } from '@angular/router';
import { ThreadDetailComponent } from './thread/thread-detail.component';

export const ForumRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./forum-page.component').then(c => c.ForumPageComponent),
    title: 'Forum - Explore discussions, ask questions, and share knowledge',
  },

  {
    path: 'my-threads',
    loadComponent: () => import('./forum-page.component').then(c => c.ForumPageComponent),
    data: {
      filterByUser: true,
      breadcrumb: 'My Threads',
    },
  },

  {
    path: 'search',
    loadComponent: () => import('./forum-page.component').then(c => c.ForumPageComponent),
    data: {
      searchMode: true,
      breadcrumb: 'Search Results',
    },
  },

  {
    path: 'tags/:tag',
    loadComponent: () => import('./forum-page.component').then(c => c.ForumPageComponent),
    data: {
      filterByTag: true,
      breadcrumb: 'Tag',
    },
  },

  {
    path: 'create',
    outlet: 'modal',
    loadComponent: () => import('./create-thread/create-thread.component').then((c) => c.CreateThreadComponent),
  },

  {
    path: 'categories/:category',
    loadComponent: () => import('./forum-page.component').then(c => c.ForumPageComponent),
    data: {
      filterByCategory: true,
      breadcrumb: 'Category',
    },
  },

  {
    path: 'thread/:threadId',
    component: ThreadDetailComponent,
    data: {
      breadcrumb: 'Thread Details',
      animation: 'thread-detail',
    },
  },
];
