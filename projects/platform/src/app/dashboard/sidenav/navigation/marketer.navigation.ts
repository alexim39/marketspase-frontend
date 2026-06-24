import { NavigationItem } from './navigation.model';

export function getMarketerNavigation(
  pendingCampaigns: number,
  activeCampaigns: number,
  unreadMessagesCount: number = 0
): NavigationItem[] {
  return [
     {
      // Discovery, engagement, content
      icon: 'home',
      label: 'Home',
      route: '/dashboard/home',
      expanded: false
    },

    {
      // Analytics, business management
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
      icon: 'campaign',
      label: 'Campaigns',
      badge: pendingCampaigns,
      badgeColor: 'warn',
      expanded: false,
      children: [
        { icon: 'list_alt', label: 'My Campaigns', route: '/dashboard/campaigns' },
        { icon: 'add_circle', label: 'Create Campaign', route: '/dashboard/campaigns/create' },
        { icon: 'insights', label: 'Analytics', route: '/dashboard/campaigns/analytics' },
        { icon: 'bar_chart', label: 'Metrics', route: '/dashboard/campaigns/metrics' },
      ]
    },

    {
      icon: 'storefront',
      label: 'Storefronts',
      expanded: false,
      children: [
        { icon: 'store', label: 'My Stores', route: '/dashboard/stores' },
        { icon: 'add_business', label: 'Add Store', route: '/dashboard/stores/create' },
        { icon: 'receipt_long', label: 'Orders & Delivery', route: '/dashboard/stores/orders' },
        { icon: 'insights', label: 'Products Analytics', route: '/dashboard/stores/promoted-products-analytics' },

       /*  {
          icon: 'support_agent',
          label: 'Customer Support',
          expanded: false,
          children: [
            { icon: 'supervisor_account', label: 'Customers', route: '/dashboard/stores/support' },
            { icon: 'contacts', label: 'Contacts', route: '/dashboard/stores/contacts' },
            { icon: 'mark_email_read', label: 'Email Subscribers', route: '/dashboard/stores/subscribers' }
          ]
        } */
       
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
      icon: 'support_agent',
      label: 'Customer Support',
      expanded: false,
      children: [
        { icon: 'supervisor_account', label: 'Customers', route: '/dashboard/stores/support' },
        { icon: 'contacts', label: 'Contacts', route: '/dashboard/stores/contacts' },
        { icon: 'mark_email_read', label: 'Email Subscribers', route: '/dashboard/stores/subscribers' }
      ]
    },

    {
      icon: 'android',
      label: 'AI Assistant',
      expanded: false,
      children: [
        { icon: 'support_agent', label: 'Support Assistant', route: '/dashboard/assistant/customer/overview' },
        // { icon: 'dynamic_feed', label: 'Social Media Management', route: '/dashboard/assistant/social/overview' },
        // { icon: 'analytics', label: 'Business Insights', route: '/dashboard/assistant/insights' },
        // { icon: 'settings', label: 'Settings', route: '/dashboard/assistant/settings' }
      ]
    },

    {
      icon: 'attach_email',
      label: 'Messages',
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'warn',
      expanded: false,
      children: [
        {
          icon: 'inbox',
          label: 'Inbox',
          route: '/dashboard/messages/inbox'
        },
        {
          icon: 'groups',
          label: 'Group Chats',
          route: '/dashboard/messages/groups'
        },
        {
          icon: 'dynamic_feed',
          label: 'Activity Feed',
          //route: '/dashboard/messages/activity'
          route: '/dashboard/messages'
        },
      ]
    },

    {
      icon: 'forum',
      label: 'Community',
      expanded: false,
      children: [
        { icon: 'chat', label: 'Discussions', route: '/dashboard/community/discussion' },
        { icon: 'dynamic_feed', label: 'Create Post', route: '/dashboard/community/feeds/create'  },
        { icon: 'military_tech', label: 'Gamification', route: '/dashboard/gamification' },
      ]
    },

    {
      icon: 'leaderboard',
      label: 'Leaderboard',
      route: '/dashboard/leaderboard',
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
            { icon: 'add', label: 'Fund Wallet', modalAction: 'fundWallet' },
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
        { icon: 'person', label: 'Profile Settings', route: '/dashboard/settings/account' },
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
