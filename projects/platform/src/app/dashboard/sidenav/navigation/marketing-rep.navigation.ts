import { NavigationItem } from './navigation.model';

export const MARKETING_REP_NAVIGATION: NavigationItem[] = [
  { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', expanded: false },
  {
    icon: 'group',
    label: 'Team Management',
    expanded: false,
    children: [
      { icon: 'people', label: 'My Marketers', route: '/dashboard/marketers' },
      { icon: 'person_add', label: 'Add Marketer', route: '/dashboard/marketers/add' },
      { icon: 'assessment', label: 'Performance Reports', route: '/dashboard/marketers/reports' },
      {
        icon: 'payments',
        label: 'Commission Management',
        expanded: false,
        children: [
          { icon: 'calculate', label: 'Calculate Commissions', route: '/dashboard/commissions/calculate' },
          { icon: 'receipt_long', label: 'Commission Reports', route: '/dashboard/commissions/reports' },
          { icon: 'payments', label: 'Payouts', route: '/dashboard/commissions/payouts' }
        ]
      }
    ]
  }
];
