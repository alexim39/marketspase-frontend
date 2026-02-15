import { NavigationItem } from './navigation.model';

export function getPromoterNavigation(
  pendingPromotions: number
): NavigationItem[] {
  return [
    {
      icon: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      expanded: false
    },
    {
      icon: 'work',
      label: 'Promotions',
      badge: pendingPromotions,
      badgeColor: 'warn',
      expanded: false,
      children: [
        { icon: 'search', label: 'Find Campaigns', route: '/dashboard/campaigns' },
        { icon: 'list_alt', label: 'My Promotions', route: '/dashboard/campaigns/promotions' }
      ]
    },
    // {
    //   icon: 'storefront',
    //   label: 'Storefronts',
    //   expanded: false,
    //   children: [
    //     { icon: 'search', label: 'Browse Products', route: '/dashboard/stores' },
    //     // { icon: 'search', label: 'Browse Products', route: '/dashboard/storefronts/products' },
    //     { icon: 'inventory', label: 'My Promoted Products', route: '/dashboard/storefronts/my-products' },
    //     { icon: 'link', label: 'My Storefront Links', route: '/dashboard/storefronts/links' },
    //     { icon: 'analytics', label: 'Product Performance', route: '/dashboard/storefronts/performance' },
    //     { icon: 'star', label: 'Favorites', route: '/dashboard/storefronts/favorites' },
    //     { icon: 'rate_review', label: 'Store Reviews', route: '/dashboard/storefronts/reviews' }
    //   ]
    // },
    {
      icon: 'currency_exchange',
      label: 'Earnings',
      expanded: false,
      children: [
        { icon: 'payments', label: 'Transactions', route: '/dashboard/transactions' },
        { icon: 'savings', label: 'Withdraw Funds', route: '/dashboard/transactions/withdrawal' }
      ]
    },
    {
      icon: 'forum',
      label: 'Community',
      expanded: false,
      children: [
        { icon: 'chat', label: 'Discussions', route: '/dashboard/community/discussion' },
        {
          icon: 'dynamic_feed',
          label: 'Feed',
          expanded: false,
          children: [
           { icon: 'notifications', label: 'Create', route: '/dashboard/community/feeds/create' },
           { icon: 'quickreply', label: 'Social Feeds', route: '/dashboard/community/feeds'  }
          ]
        }
      ]
    },
    {
      icon: 'settings',
      label: 'Settings',
      expanded: false,
      children: [
        { icon: 'person', label: 'Profile', route: '/dashboard/settings/account' },
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
        {
          icon: 'help',
          label: 'Get Started',
          expanded: false,
          children: [
            { icon: 'directions_bus', label: 'Onboarding', route: '/dashboard/get-started/onboarding' }
          ]
        }
      ]
    }
  ];
}
