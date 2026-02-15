import { Routes } from '@angular/router';

export const CommunityRoutes: Routes = [
  {
    path: '',
    redirectTo: 'feeds', // Redirects /community to /community/forum
    pathMatch: 'full',
  },
  {
    path: 'discussion',
    loadChildren: () => import('./forum/forum.routes').then(c => c.ForumRoutes),
  },
  {
    path: 'feeds',
    loadChildren: () => import('./feeds/feeds.routes').then(c => c.FeedsRoutes),
  },
];
