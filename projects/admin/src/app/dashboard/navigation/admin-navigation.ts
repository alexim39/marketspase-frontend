export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isExpanded?: boolean;
}

export interface SearchResultItem {
  id: string;
  title: string;
  route: string;
  parentTitle?: string;
  icon: string;
}

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    title: 'Overview',
    icon: 'dashboard',
    route: '/dashboard',
  },
  {
    id: 'users',
    title: 'Users',
    icon: 'group',
    children: [
      { id: 'all-users', title: 'All Users', icon: 'supervisor_account', route: '/dashboard/users' },
      { id: 'active-users', title: 'Active Users', icon: 'wifi', route: '/dashboard/users/active' },
      { id: 'user-analytics', title: 'User Analytics', icon: 'insights', route: '/dashboard/users/analytics' },
      { id: 'collaboration-reviews', title: 'Collaboration Reviews', icon: 'reviews', route: '/dashboard/users/reviews' },
      { id: 'marketers', title: 'Marketers', icon: 'business', route: '/dashboard/users/marketers' },
      { id: 'promoters', title: 'Promoters', icon: 'share', route: '/dashboard/users/promoters' },
      { id: 'contacts', title: 'Contact Management', icon: 'contact_page', route: '/dashboard/users/contacts' },
    ],
  },
  {
    id: 'ads',
    title: 'Ads & Promotions',
    icon: 'campaign',
    children: [
      { id: 'all-campaigns', title: 'All Campaigns', icon: 'campaign', route: '/dashboard/campaigns' },
      { id: 'all-promotions', title: 'All Promotions', icon: 'ads_click', route: '/dashboard/promotions' },
      { id: 'ppc-analytics', title: 'PPC Analytics', icon: 'query_stats', route: '/dashboard/promotions/ppc-analytics' },
      { id: 'promotion-fraud', title: 'Fraud Monitor', icon: 'shield', route: '/dashboard/promotions/fraud' },
      { id: 'leads', title: 'Leads', icon: 'contact_phone', route: '/dashboard/leads' },
      { id: 'metrics', title: 'Metrics', icon: 'query_stats', route: '/dashboard/metrics' },
    ],
  },
  {
    id: 'storefront',
    title: 'Storefront',
    icon: 'storefront',
    children: [
      { id: 'view-stores', title: 'Stores', icon: 'store', route: '/dashboard/stores' },
      { id: 'storefront-analytics', title: 'Storefront Analytics', icon: 'query_stats', route: '/dashboard/stores/analytics' },
      { id: 'store-subscribers', title: 'Email Subscribers', icon: 'mark_email_read', route: '/dashboard/stores/subscribers' },
      { id: 'store-buyers', title: 'Buyers', icon: 'groups', route: '/dashboard/stores/buyers' },
      { id: 'store-reviews', title: 'Product Reviews', icon: 'rate_review', route: '/dashboard/stores/reviews' },
      { id: 'store-release-requests', title: 'Delivery Releases', icon: 'verified_user', route: '/dashboard/stores/delivery-releases' },
    ],
  },
  {
    id: 'payments',
    title: 'Finance',
    icon: 'payments',
    isExpanded: true,
    children: [
      { id: 'financial-analytics', title: 'Financial Analytics', icon: 'query_stats', route: '/dashboard/financial/analytics' },
      { id: 'all-withdrawals', title: 'Withdrawals', icon: 'payment_arrow_down', route: '/dashboard/financial' },
      { id: 'all-deposits', title: 'Deposits', icon: 'account_balance_wallet', route: '/dashboard/financial/deposits' },
      { id: 'all-transfers', title: 'Transfers', icon: 'swap_horiz', route: '/dashboard/financial/transfers' },
      { id: 'refund-requests', title: 'Refund Requests', icon: 'currency_exchange', route: '/dashboard/financial/refunds' },
      { id: 'fund-recovery', title: 'Fund Recovery', icon: 'playlist_remove', route: '/dashboard/financial/recovery' },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    icon: 'forum',
    children: [
      { id: 'community-desk', title: 'Community Desk', icon: 'dynamic_feed', route: '/dashboard/community' },
      { id: 'all-posts', title: 'Posts', icon: 'post_add', route: '/dashboard/posts' },
      { id: 'all-testimonials', title: 'Testimonials', icon: 'reviews', route: '/dashboard/testimonials' },
      { id: 'newsletters', title: 'Newsletters', icon: 'newspaper', route: '/dashboard/newsletters' },
    ],
  },
  {
    id: 'rewards',
    title: 'Rewards & Growth',
    icon: 'emoji_events',
    children: [
      { id: 'login-streak-settings', title: 'Daily Login Streak', icon: 'calendar_view_day', route: '/dashboard/settings/login-streaks' },
      { id: 'badge-settings', title: 'Badges & Levels', icon: 'workspace_premium', route: '/dashboard/settings/badges' },
      { id: 'gamification-settings', title: 'Gamification', icon: 'military_tech', route: '/dashboard/settings/gamification' },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings_applications',
    children: [
      { id: 'payment-settings', title: 'Payment Settings', icon: 'payments', route: '/dashboard/settings/payments' },
      { id: 'ppc-pricing-settings', title: 'PPC Pricing', icon: 'price_change', route: '/dashboard/settings/ppc-pricing' },
    ],
  },
];
