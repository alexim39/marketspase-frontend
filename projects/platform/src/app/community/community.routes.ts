import { Routes } from '@angular/router';

export const CommunityRoutes: Routes = [
  {
    path: '',
    redirectTo: 'discussion', // Redirects /community to /community/forum
    pathMatch: 'full',
  },
  {
    path: 'discussion',
    loadChildren: () => import('./forum/forum.routes').then(c => c.ForumRoutes),
  },
];
