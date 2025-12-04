import { Component, signal, computed, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { AdminService } from '../common/services/user.service';
import { AuthService } from '../auth/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../../../../shared-services/src/public-api';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isExpanded?: boolean;
}

@Component({
  selector: 'app-whatsapp-admin-dashboard',
  standalone: true,
  providers: [AuthService, LoadingService],
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressBarModule],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  readonly adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);
  public loadingService = inject(LoadingService);

  // Component state
  sidebarCollapsed = signal(false);
  activeNavItem = signal('dashboard');
  searchQuery = signal('');
  notificationCount = signal(5);

  private readonly destroyRef = inject(DestroyRef);

  // Menu structure combining your original menus with comprehensive structure
  menuItems = signal<MenuItem[]>([
    {
      id: 'dashboard',
      title: 'Dashboard Overview',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      id: 'users',
      title: 'User Management',
      icon: 'group',
      isExpanded: false,
      children: [
        { id: 'all-users', title: 'All Users', icon: 'supervisor_account', route: '/dashboard/users' },
        { id: 'marketers', title: 'Marketers', icon: 'business', route: '/dashboard/users/marketers' },
        { id: 'promoters', title: 'Promoters', icon: 'share', route: '/dashboard/users/promoters' },
        { id: 'kyc', title: 'KYC Verification', icon: 'verified_user', route: '/dashboard/users/kyc' },
        { id: 'trust-scores', title: 'Trust Scores & Ratings', icon: 'star_rate', route: '/dashboard/users/trust-scores' },
        { id: 'blacklist', title: 'Blacklist Management', icon: 'block', route: '/dashboard/users/blacklist' }
      ]
    },
    {
      id: 'campaigns',
      title: 'Campaign Management',
      icon: 'campaign',
      isExpanded: false,
      children: [
        { id: 'all-campaigns', title: 'All Campaigns', icon: 'campaign', route: '/dashboard/campaigns' },
        { id: 'active-campaigns', title: 'Active Campaigns', icon: 'play_circle', route: '/dashboard/campaigns/active' },
        { id: 'pending-campaigns', title: 'Pending Approvals', icon: 'pending', route: '/dashboard/campaigns/pending' },
        { id: 'campaign-performance', title: 'Performance Analytics', icon: 'trending_up', route: '/dashboard/campaigns/analytics' },
        { id: 'campaign-archive', title: 'Campaign Archive', icon: 'archive', route: '/dashboard/campaigns/archive' },
        { id: 'campaign-moderation', title: 'Content Moderation', icon: 'approval', route: '/dashboard/campaigns/moderation' }
      ]
    },
    {
      id: 'promotions', // Your original "Promotions" menu
      title: 'Promotion Management',
      icon: 'sell',
      isExpanded: false,
      children: [
        { id: 'all-promotions', title: 'All Promotions', icon: 'ad', route: '/dashboard/promotions' },
        { id: 'active-promotions', title: 'Active Promotions', icon: 'rocket_launch', route: '/dashboard/promotions/active' },
        { id: 'promotion-performance', title: 'Promotion Performance', icon: 'bar_chart', route: '/dashboard/promotions/performance' },
        { id: 'status-tracker', title: 'Status Tracking', icon: 'track_changes', route: '/dashboard/promotions/tracking' },
        { id: 'view-analytics', title: 'View Analytics', icon: 'visibility', route: '/dashboard/promotions/views' }
      ]
    },
    {
      id: 'view-verification',
      title: 'View Verification',
      icon: 'visibility',
      isExpanded: false,
      children: [
        { id: 'view-tracking', title: '24-Hour Tracking', icon: 'schedule', route: '/dashboard/verification/tracking' },
        { id: 'validation-dashboard', title: 'Validation Dashboard', icon: 'check_circle', route: '/dashboard/verification/validation' },
        { id: 'fraud-detection', title: 'Fraud Detection', icon: 'security', route: '/dashboard/verification/fraud' },
        { id: 'disputes', title: 'Dispute Resolution', icon: 'gavel', route: '/dashboard/verification/disputes' },
        { id: 'manual-verification', title: 'Manual Verification', icon: 'handyman', route: '/dashboard/verification/manual' }
      ]
    },
    {
      id: 'payments',
      title: 'Payments & Finance',
      icon: 'payments',
      isExpanded: false,
      children: [
        { id: 'all-withdrawals', title: 'All Withdrawals', icon: 'payment_arrow_down', route: '/dashboard/financial' },
        { id: 'marketer-payments', title: 'Marketer Deposits', icon: 'upload', route: '/dashboard/payments/deposits' },
        { id: 'promoter-payouts', title: 'Promoter Payouts', icon: 'download', route: '/dashboard/payments/payouts' },
        { id: 'transactions', title: 'Transaction History', icon: 'history', route: '/dashboard/payments/transactions' },
        { id: 'financial-reports', title: 'Financial Reports', icon: 'summarize', route: '/dashboard/payments/reports' },
        { id: 'refund-requests', title: 'Refund Requests', icon: 'currency_exchange', route: '/dashboard/payments/refunds' }
      ]
    },
    {
      id: 'testimonials', // Your original "Testimonials" menu
      title: 'Testimonial Management',
      icon: 'reviews',
      isExpanded: false,
      children: [
        { id: 'all-testimonials', title: 'All Testimonials', icon: 'share_reviews', route: '/dashboard/testimonials' },
        { id: 'pending-testimonials', title: 'Pending Testimonials', icon: 'hourglass_empty', route: '/dashboard/testimonials/pending' },
        { id: 'approved-testimonials', title: 'Approved Testimonials', icon: 'check_circle', route: '/dashboard/testimonials/approved' },
        { id: 'featured-testimonials', title: 'Featured Testimonials', icon: 'star', route: '/dashboard/testimonials/featured' },
        { id: 'testimonial-moderate', title: 'Moderation Queue', icon: 'rate_review', route: '/dashboard/testimonials/moderate' }
      ]
    },
    {
      id: 'newsletters', // Your original "Newsletters" menu
      title: 'Newsletters Management',
      icon: 'newspaper',
      isExpanded: false,
      children: [
        { id: 'all-newsletter', title: 'All Newsletter', icon: 'unsubscribe', route: '/dashboard/newletters' },
        { id: 'compose-newsletter', title: 'Compose Newsletter', icon: 'edit', route: '/dashboard/newsletters/compose' },
        { id: 'newsletter-templates', title: 'Email Templates', icon: 'description', route: '/dashboard/newsletters/templates' },
        { id: 'subscribers', title: 'Subscribers List', icon: 'groups', route: '/dashboard/newsletters/subscribers' },
        { id: 'newsletter-analytics', title: 'Newsletter Analytics', icon: 'analytics', route: '/dashboard/newsletters/analytics' },
        { id: 'campaign-newsletters', title: 'Campaign Newsletters', icon: 'campaign', route: '/dashboard/newsletters/campaigns' }
      ]
    },
    {
      id: 'fraud',
      title: 'Fraud & Compliance',
      icon: 'policy',
      isExpanded: false,
      children: [
        { id: 'fraud-dashboard', title: 'Fraud Dashboard', icon: 'warning', route: '/dashboard/fraud/dashboard' },
        { id: 'suspicious-activity', title: 'Suspicious Activity', icon: 'search', route: '/dashboard/fraud/activity' },
        { id: 'compliance', title: 'Compliance Reports', icon: 'assignment', route: '/dashboard/fraud/compliance' },
        { id: 'tos-violations', title: 'ToS Violations', icon: 'gavel', route: '/dashboard/fraud/violations' },
        { id: 'audit-logs', title: 'Audit Logs', icon: 'list_alt', route: '/dashboard/fraud/audit' }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics & Reports',
      icon: 'analytics',
      isExpanded: false,
      children: [
        { id: 'platform-analytics', title: 'Platform Growth', icon: 'insights', route: '/dashboard/analytics/platform' },
        { id: 'user-analytics', title: 'User Analytics', icon: 'people', route: '/dashboard/analytics/users' },
        { id: 'revenue-analytics', title: 'Revenue Trends', icon: 'trending_up', route: '/dashboard/analytics/revenue' },
        { id: 'campaign-analytics', title: 'Campaign Analytics', icon: 'campaign', route: '/dashboard/analytics/campaigns' },
        { id: 'custom-reports', title: 'Custom Reports', icon: 'description', route: '/dashboard/analytics/custom' }
      ]
    },
    {
      id: 'settings',
      title: 'Platform Settings',
      icon: 'settings',
      isExpanded: false,
      children: [
        { id: 'platform-settings', title: 'Platform Settings', icon: 'tune', route: '/dashboard/settings/platform' },
        { id: 'payment-settings', title: 'Payment Settings', icon: 'payments', route: '/dashboard/settings/payments' },
        { id: 'notification-settings', title: 'Notifications', icon: 'notifications', route: '/dashboard/settings/notifications' },
        { id: 'content-guidelines', title: 'Content Guidelines', icon: 'policy', route: '/dashboard/settings/content' },
        { id: 'view-threshold', title: 'View Threshold (40 views)', icon: 'visibility', route: '/dashboard/settings/threshold' },
        { id: 'min-payout', title: 'Min Payout (N200)', icon: 'attach_money', route: '/dashboard/settings/payout' }
      ]
    },
    {
      id: 'support',
      title: 'Support & Disputes',
      icon: 'support_agent',
      isExpanded: false,
      children: [
        { id: 'support-tickets', title: 'Support Tickets', icon: 'confirmation_number', route: '/dashboard/support/tickets' },
        { id: 'campaign-disputes', title: 'Campaign Disputes', icon: 'campaign', route: '/dashboard/support/campaign-disputes' },
        { id: 'payment-disputes', title: 'Payment Disputes', icon: 'payments', route: '/dashboard/support/payment-disputes' },
        { id: 'resolution-center', title: 'Resolution Center', icon: 'mediation', route: '/dashboard/support/resolution' }
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing Tools',
      icon: 'campaign',
      isExpanded: false,
      children: [
        { id: 'platform-promotions', title: 'Platform Promotions', icon: 'local_offer', route: '/dashboard/marketing/promotions' },
        { id: 'referral-program', title: 'Referral Program', icon: 'share', route: '/dashboard/marketing/referrals' },
        { id: 'discount-codes', title: 'Discount/Coupon Codes', icon: 'discount', route: '/dashboard/marketing/discounts' },
        { id: 'user-incentives', title: 'User Incentives', icon: 'emoji_events', route: '/dashboard/marketing/incentives' }
      ]
    },
    {
      id: 'system',
      title: 'System Admin',
      icon: 'admin_panel_settings',
      isExpanded: false,
      children: [
        { id: 'admin-users', title: 'Admin Users', icon: 'manage_accounts', route: '/dashboard/system/admins' },
        { id: 'api-management', title: 'API Management', icon: 'api', route: '/dashboard/system/api' },
        { id: 'system-logs', title: 'System Logs', icon: 'list_alt', route: '/dashboard/system/logs' },
        { id: 'database-management', title: 'Database Management', icon: 'storage', route: '/dashboard/system/database' },
        { id: 'backup-restore', title: 'Backup & Restore', icon: 'backup', route: '/dashboard/system/backup' }
      ]
    }
  ]);

  // Page title computed signal - updated to handle your original page titles
  pageTitle = computed(() => {
    const titles: Record<string, string> = {
      'dashboard': 'Dashboard Overview',
      'user': 'User Management',
      'campaigns': 'Campaign Management',
      'promotions': 'Promotion Management',
      'testimonials': 'Testimonial Management',
      'newsletters': 'Newsletters Management',
      'financial': 'Financial Management',
      'analytics': 'Analytics & Reports',
      'settings': 'Platform Settings',
      'logout': ''
    };

    // First check if it's one of your original titles
    if (titles[this.activeNavItem()]) {
      return titles[this.activeNavItem()];
    }

    // Otherwise, search through menu items
    const findTitle = (items: MenuItem[]): string => {
      for (const item of items) {
        if (item.id === this.activeNavItem()) {
          return item.title;
        }
        if (item.children) {
          const childTitle = findTitle(item.children);
          if (childTitle) return childTitle;
        }
      }
      return 'Dashboard Overview';
    };
    
    return findTitle(this.menuItems());
  });

  currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  ngOnInit(): void {
    this.adminService.fetchAdmin();

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationStart ||
                       event instanceof NavigationEnd ||
                       event instanceof NavigationCancel ||
                       event instanceof NavigationError)
      )
      .subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loadingService.show();
        } else if (event instanceof NavigationEnd) {
          this.loadingService.hide();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          this.updateActiveStateFromRoute();
        } else if (event instanceof NavigationCancel ||
                  event instanceof NavigationError) {
          this.loadingService.hide();
        }
      });

    // Initialize active state from current route
    this.updateActiveStateFromRoute();
  }

  updateActiveStateFromRoute(): void {
    const url = this.router.url;
    
    // Helper function to find item by route
    const findItemByRoute = (items: MenuItem[], targetRoute: string): string | null => {
      for (const item of items) {
        if (item.route === targetRoute) {
          return item.id;
        }
        if (item.children) {
          const childResult = findItemByRoute(item.children, targetRoute);
          if (childResult) {
            // Expand parent if child is active
            this.expandMenuItem(item.id);
            return childResult;
          }
        }
      }
      return null;
    };

    const activeId = findItemByRoute(this.menuItems(), url);
    if (activeId) {
      this.activeNavItem.set(activeId);
    } else {
      // Fallback for your original routes
      const routeMapping: Record<string, string> = {
        '/dashboard/users': 'user',
        '/dashboard/campaigns': 'campaigns',
        '/dashboard/promotions': 'promotions',
        '/dashboard/testimonials': 'testimonials',
        '/dashboard/newletters': 'newsletters',
        '/dashboard/financial': 'financial',
        '/dashboard/analytics': 'analytics',
        '/dashboard/settings': 'settings'
      };
      
      if (routeMapping[url]) {
        this.activeNavItem.set(routeMapping[url]);
      }
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  toggleMenuItem(menuItem: MenuItem): void {
    if (menuItem.children) {
      // Toggle expansion state
      const updatedItems = this.menuItems().map(item => {
        if (item.id === menuItem.id) {
          return { ...item, isExpanded: !item.isExpanded };
        }
        return item;
      });
      this.menuItems.set(updatedItems);
    } else if (menuItem.route) {
      this.setActiveNavItem(menuItem.id);
      this.router.navigate([menuItem.route]);
    }
  }

  setActiveNavItem(itemId: string) {
    this.activeNavItem.set(itemId);
  }

  expandMenuItem(menuId: string): void {
    const updatedItems = this.menuItems().map(item => {
      if (item.id === menuId) {
        return { ...item, isExpanded: true };
      }
      return item;
    });
    this.menuItems.set(updatedItems);
  }

  isActiveOrChildActive(menuItem: MenuItem): boolean {
    if (menuItem.id === this.activeNavItem()) return true;
    
    if (menuItem.children) {
      return menuItem.children.some(child => 
        child.id === this.activeNavItem() || this.isActiveOrChildActive(child)
      );
    }
    
    return false;
  }

  onSearchInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
  }

  logout() {
    this.authService.signOut({})
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            localStorage.removeItem('isAuthenticated');
            this.router.navigate(['/'], { replaceUrl: true });
          }
        },
        error: (error) => {
          console.error('Error during sign out:', error);
          this.router.navigate(['/'], { replaceUrl: true });
        }
      });
  }
}