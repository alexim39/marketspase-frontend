import { NavigationItem } from './navigation.model';

export function getMarketerNavigation(
  pendingCampaigns: number,
  activeCampaigns: number
): NavigationItem[] {
  return [
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      expanded: false
    },
    {
      icon: 'campaign',
      label: 'Campaigns',
      badge: pendingCampaigns,
      badgeColor: 'warn',
      expanded: false,
      children: [
        { icon: 'list_alt', label: 'My Campaigns', route: '/dashboard/campaigns' },
        { icon: 'add_circle', label: 'Create Campaign', route: '/dashboard/campaigns/create' }
      ]
    },
    {
      icon: 'storefront',
      label: 'Storefronts',
      expanded: false,
      children: [
        { icon: 'store', label: 'My Stores', route: '/dashboard/stores' },
        { icon: 'add_business', label: 'Add Store', route: '/dashboard/stores/create' },
        // { icon: 'analytics', label: 'Store Analytics', route: '/dashboard/stores/analytics' },
        // {
        //   icon: 'inventory',
        //   label: 'Product Management',
        //   expanded: false,
        //   children: [
        //     { icon: 'inventory_2', label: 'All Products', route: '/dashboard/stores/products' },
        //     { icon: 'add_shopping_cart', label: 'Add Product', route: '/dashboard/stores/products/create' },
        //     { icon: 'category', label: 'Categories', route: '/dashboard/stores/categories' }
        //   ]
        // }
      ]
    },
    {
      icon: 'currency_exchange',
      label: 'Transactions',
      expanded: false,
      children: [
        { icon: 'payments', label: 'Payment History', route: '/dashboard/transactions' },
        {
          icon: 'savings',
          label: 'Wallet Management',
          expanded: false,
          children: [
            { icon: 'add', label: 'Fund Wallet', modalAction: 'fundWallet' }
          ]
        }
      ]
    },
    {
      icon: 'forum',
      label: 'Community',
      expanded: false,
      children: [
        { icon: 'chat', label: 'Forum', route: '/dashboard/forum' }
      ]
    },
    {
      icon: 'settings',
      label: 'Settings',
      expanded: false,
      children: [
        { icon: 'person', label: 'Profile Settings', route: '/dashboard/settings/account' },
       // { icon: 'notifications', label: 'Notifications', route: '/dashboard/settings/system' }
        {
          icon: 'hvac',
          label: 'System',
          expanded: false,
          children: [
           { icon: 'notifications', label: 'Theme & Notifications', route: '/dashboard/settings/system' }
          ]
        }
      ]
    },
    {
      icon: 'help',
      label: 'Support',
      expanded: false,
      children: [
        { icon: 'support_agent', label: 'Support', route: '/dashboard/settings/share' },
        { icon: 'help', label: 'Get Started', route: '/dashboard/get-started' }
      ]
    }
  ];
}
