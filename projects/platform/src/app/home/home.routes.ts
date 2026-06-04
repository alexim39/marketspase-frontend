import { Routes } from '@angular/router';

export const HomeRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('../community/feeds').then(c => c.FeedIndexComponent),
    title: 'Home - MarketSpase Social Feed',
  },
];
