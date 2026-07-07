import { NavigationItem } from './navigation.model';

export const ADMIN_NAVIGATION: NavigationItem[] = [
  { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', expanded: false },
  {
    icon: 'ads_click',
    label: 'Ads & Promotion',
    expanded: false,
    children: [
      { icon: 'insights', label: 'PPC Analytics', route: '/dashboard/ads/ppc-analytics' },
    ],
  },
  {
    icon: 'storefront',
    label: 'Storefronts',
    expanded: false,
    children: [
      { icon: 'rule', label: 'Release Reviews', route: '/dashboard/stores/orders' }
    ]
  },
  {
    icon: 'gavel',
    label: 'Dispute Resolution',
    route: '/dashboard/admin/disputes',
    expanded: false
  }
];
