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
      icon: 'account_box',
      label: 'Profile',
      route: '/dashboard/profile',
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
        { icon: 'list_alt', label: 'My Promotions', route: '/dashboard/campaigns/promotions' },
        // { icon: 'design_services', label: 'Ad Template Builder', route: '/dashboard/campaigns/promotions/ad-builder' },
        { icon: 'insights', label: 'Analytics', route: '/dashboard/campaigns/analytics' },
        { icon: 'gpp_bad', label: 'Account Health', route: '/dashboard/campaigns/promotions/compliance' },
        { icon: 'forum', label: 'Collaboration', route: '/dashboard/campaigns/collaboration' }
      ]
    },

    {
      icon: 'storefront',
      label: 'Storefronts',
      expanded: false,
      children: [
        { icon: 'store', label: 'Explore Stores', route: '/dashboard/stores' },
        { icon: 'search', label: 'Browse Products', route: '/dashboard/stores/products' },
        { icon: 'inventory', label: 'Promoted Products', route: '/dashboard/stores/promotions' },
        { icon: 'receipt_long', label: 'Affiliate Sales', route: '/dashboard/stores/orders' },
        //{ icon: 'link', label: 'My Storefront Links', route: '/dashboard/storefronts/links' },
        //{ icon: 'analytics', label: 'Product Performance', route: '/dashboard/storefronts/performance' },
        //{ icon: 'star', label: 'Favorites', route: '/dashboard/storefronts/favorites' },
        //{ icon: 'rate_review', label: 'Store Reviews', route: '/dashboard/storefronts/reviews' }
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
           //{ icon: 'notifications', label: 'Create', route: '/dashboard/community/feeds/create' }, Promoters should not be able to create post at the time
           { icon: 'quickreply', label: 'Social Feeds', route: '/dashboard/community/feeds'  }
          ]
        }
      ]
    },

    {
      icon: 'leaderboard',
      label: 'Leaderboard',
      route: '/dashboard/leaderboard',
      expanded: false
    },

    {
      icon: 'military_tech',
      label: 'Gamification',
      route: '/dashboard/gamification',
      expanded: false
    },


    {
      icon: 'currency_exchange',
      label: 'Transactions',
      expanded: false,
      children: [
        { icon: 'payments', label: 'Transactions', route: '/dashboard/transactions' },
        {
          icon: 'account_balance_wallet',
          label: 'Wallet Management',
          expanded: false,
          children: [
            //{ icon: 'add', label: 'Fund Wallet', modalAction: 'fundWallet' },
            { icon: 'savings', label: 'Withdraw Funds', route: '/dashboard/transactions/withdrawal' },
            { icon: 'transform', label: 'Transfer Funds', route: '/dashboard/transactions/transfer' }
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
        },
        {
          icon: 'ads_click',
          label: 'Ads',
          expanded: false,
          children: [
           { icon: 'adjust', label: 'Preferences', route: '/dashboard/settings/ads/preferences' }
          ]
        },
      ]
    },

    {
      icon: 'help',
      label: 'Support',
      expanded: false,
      children: [
        { icon: 'support_agent', label: 'Support', route: '/dashboard/settings/support' },
        {
          icon: 'help_center',
          label: 'Learn',
          expanded: false,
          children: [
            { icon: 'help', label: 'Get Started', route: '/dashboard/get-started/onboarding' },
            { icon: 'video_call', label: 'Tutorials', route: '/dashboard/tutorials' }
          ]
        }
      ]
    }

  ];
}
