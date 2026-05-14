import { NavigationItem } from './navigation.model';

export const ADMIN_NAVIGATION: NavigationItem[] = [
  { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', expanded: false },
  {
    icon: 'storefront',
    label: 'Storefronts',
    expanded: false,
    children: [
      { icon: 'rule', label: 'Release Reviews', route: '/dashboard/stores/orders' }
    ]
  }
];
