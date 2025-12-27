import { Routes } from '@angular/router';
import { ForumPageComponent } from './forum-page.component';
import { ThreadDetailComponent } from './thread/thread-detail.component';

export const ForumRoutes: Routes = [
  {
    path: '',
    component: ForumPageComponent,
    title: 'Forum - Explore discussions, ask questions, and share knowledge',
  },

  {
    path: 'my-threads',
    component: ForumPageComponent,
    data: {
      filterByUser: true,
      breadcrumb: 'My Threads',
    },
  },

  {
    path: 'search',
    component: ForumPageComponent,
    data: {
      searchMode: true,
      breadcrumb: 'Search Results',
    },
  },

  {
    path: 'tags/:tag',
    component: ForumPageComponent,
    data: {
      filterByTag: true,
      breadcrumb: 'Tag',
    },
  },

  {
    path: 'create',
    outlet: 'modal',
    loadComponent: () =>
      import('./create-thread/create-thread.component').then(
        (c) => c.CreateThreadComponent
      ),
  },

  {
    path: 'categories/:category',
    component: ForumPageComponent,
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
