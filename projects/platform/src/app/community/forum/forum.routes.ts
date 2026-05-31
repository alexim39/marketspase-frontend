import { Routes } from '@angular/router';

export const ForumRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./').then(c => c.ForumIndexComponent),
    title: 'Forum - Explore discussions, ask questions, and share knowledge',
  },

  {
    path: 'my-threads',
    loadComponent: () => import('./').then(c => c.ForumIndexComponent),
    data: {
      filterByUser: true,
      breadcrumb: 'My Threads',
    },
  },

  {
    path: 'search',
    loadComponent: () => import('./').then(c => c.ForumIndexComponent),
    data: {
      searchMode: true,
      breadcrumb: 'Search Results',
    },
  },

  {
    path: 'tags/:tag',
    loadComponent: () => import('./').then(c => c.ForumIndexComponent),
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
    loadComponent: () => import('./').then(c => c.ForumIndexComponent),
    data: {
      filterByCategory: true,
      breadcrumb: 'Category',
    },
  },

  {
    path: ':threadId',
    loadComponent: () => import('./thread/thread-detail').then(c => c.ThreadDetailIndexComponent),
    data: {
      breadcrumb: 'Thread Details',
      animation: 'thread-detail',
    },
  },
];
