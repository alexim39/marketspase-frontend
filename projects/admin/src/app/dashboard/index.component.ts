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
import { DashboardService } from './dashboard.service';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  isExpanded?: boolean;
}

interface SearchResultItem {
  id: string;
  title: string;
  route: string;
  parentTitle?: string;
  icon: string;
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
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  public loadingService = inject(LoadingService);

  // Component state
  sidebarCollapsed = signal(false);
  activeNavItem = signal('dashboard');
  searchQuery = signal('');
  notificationCount = signal(0);

  private readonly destroyRef = inject(DestroyRef);

  // Keep navigation aligned to the admin routes and live platform model.
  menuItems = signal<MenuItem[]>([
    {
      id: 'dashboard',
      title: 'Overview',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      id: 'users',
      title: 'Users',
      icon: 'group',
      isExpanded: false,
      children: [
        { id: 'all-users', title: 'All Users', icon: 'supervisor_account', route: '/dashboard/users' },
        { id: 'user-analytics', title: 'User Analytics', icon: 'insights', route: '/dashboard/users/analytics' },
        { id: 'collaboration-reviews', title: 'Collaboration Reviews', icon: 'reviews', route: '/dashboard/users/reviews' },
        { id: 'marketers', title: 'Marketers', icon: 'business', route: '/dashboard/users/marketers' },
        { id: 'promoters', title: 'Promoters', icon: 'share', route: '/dashboard/users/promoters' },
        { id: 'contacts', title: 'Contact Management', icon: 'contact_page', route: '/dashboard/users/contacts' }
      ]
    },
    {
      id: 'ads',
      title: 'Ads & Promotions',
      icon: 'campaign',
      isExpanded: false,
      children: [
        { id: 'all-campaigns', title: 'All Campaigns', icon: 'campaign', route: '/dashboard/campaigns' },
        { id: 'all-promotions', title: 'All Promotions', icon: 'ads_click', route: '/dashboard/promotions' },
        { id: 'ppc-analytics', title: 'PPC Analytics', icon: 'query_stats', route: '/dashboard/promotions/ppc-analytics' },
        { id: 'promotion-fraud', title: 'Fraud Monitor', icon: 'shield', route: '/dashboard/promotions/fraud' }
      ]
    },
    {
      id: 'storefront',
      title: 'Storefront',
      icon: 'storefront',
      isExpanded: false,
      children: [
        { id: 'view-stores', title: 'Stores', icon: 'store', route: '/dashboard/stores' },
        { id: 'storefront-analytics', title: 'Storefront Analytics', icon: 'query_stats', route: '/dashboard/stores/analytics' },
        { id: 'store-subscribers', title: 'Email Subscribers', icon: 'mark_email_read', route: '/dashboard/stores/subscribers' },
        { id: 'store-buyers', title: 'Buyers', icon: 'groups', route: '/dashboard/stores/buyers' },
        { id: 'store-reviews', title: 'Product Reviews', icon: 'rate_review', route: '/dashboard/stores/reviews' },
        { id: 'store-release-requests', title: 'Delivery Releases', icon: 'verified_user', route: '/dashboard/stores/delivery-releases' }
      ]
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
        { id: 'fund-recovery', title: 'Fund Recovery', icon: 'playlist_remove', route: '/dashboard/financial/recovery' }
      ]
    },
    {
      id: 'community',
      title: 'Community',
      icon: 'forum',
      isExpanded: false,
      children: [
        { id: 'community-desk', title: 'Community Desk', icon: 'dynamic_feed', route: '/dashboard/community' },
        { id: 'all-testimonials', title: 'Testimonials', icon: 'reviews', route: '/dashboard/testimonials' },
        { id: 'newsletters', title: 'Newsletters', icon: 'newspaper', route: '/dashboard/newsletters' }
      ]
    },
    {
      id: 'rewards',
      title: 'Rewards & Growth',
      icon: 'emoji_events',
      isExpanded: false,
      children: [
        { id: 'login-streak-settings', title: 'Daily Login Streak', icon: 'calendar_view_day', route: '/dashboard/settings/login-streaks' },
        { id: 'badge-settings', title: 'Badges & Levels', icon: 'workspace_premium', route: '/dashboard/settings/badges' },
        { id: 'gamification-settings', title: 'Gamification', icon: 'military_tech', route: '/dashboard/settings/gamification' }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings_applications',
      isExpanded: false,
      children: [
        { id: 'payment-settings', title: 'Payment Settings', icon: 'payments', route: '/dashboard/settings/payments' },
        { id: 'ppc-pricing-settings', title: 'PPC Pricing', icon: 'price_change', route: '/dashboard/settings/ppc-pricing' }
      ]
    }
  ]);

  readonly searchableMenuItems = computed<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];
    const walk = (entries: MenuItem[], parentTitle?: string) => {
      for (const entry of entries) {
        if (entry.route) {
          items.push({
            id: entry.id,
            title: entry.title,
            route: entry.route,
            parentTitle,
            icon: entry.icon,
          });
        }

        if (entry.children?.length) {
          walk(entry.children, entry.title);
        }
      }
    };

    walk(this.menuItems());
    return items;
  });

  readonly searchResults = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return [];
    }

    return this.searchableMenuItems()
      .filter(item => {
        const haystack = `${item.title} ${item.parentTitle ?? ''} ${item.route}`.toLowerCase();
        return haystack.includes(query);
      })
      .slice(0, 6);
  });

  pageTitle = computed(() => {
    const titles: Record<string, string> = {
      'dashboard': 'Overview',
      'users': 'Users',
      'ads': 'Ads & Promotions',
      'storefront': 'Storefront',
      'payments': 'Finance',
      'community': 'Community',
      'rewards': 'Rewards & Growth',
      'settings': 'Settings',
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
    this.loadFraudPulse();

    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
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
        '/dashboard/users': 'users',
        '/dashboard/campaigns': 'ads',
        '/dashboard/promotions': 'ads',
        '/dashboard/stores': 'storefront',
        '/dashboard/financial': 'payments',
        '/dashboard/community': 'community',
        '/dashboard/newletters': 'community',
        '/dashboard/newsletters': 'community',
        '/dashboard/testimonials': 'community',
        '/dashboard/settings/payments': 'settings',
        '/dashboard/settings/ppc-pricing': 'settings',
        '/dashboard/settings/login-streaks': 'rewards',
        '/dashboard/settings/badges': 'rewards',
        '/dashboard/settings/gamification': 'rewards'
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

  navigateToSearchResult(result: SearchResultItem): void {
    this.searchQuery.set('');
    this.setActiveNavItem(result.id);
    this.updateExpandedStateForRoute(result.route);
    this.router.navigate([result.route]);
  }

  openFraudDesk(): void {
    this.setActiveNavItem('promotion-fraud');
    this.expandMenuItem('ads');
    this.router.navigate(['/dashboard/promotions/fraud']);
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

  private updateExpandedStateForRoute(route: string): void {
    const updatedItems = this.menuItems().map(item => ({
      ...item,
      isExpanded: item.children?.some(child => child.route === route) ? true : item.isExpanded,
    }));
    this.menuItems.set(updatedItems);
  }

  private loadFraudPulse(): void {
    this.dashboardService.getFraudPulse()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const total = response?.count || 0;
          this.notificationCount.set(Math.min(total, 99));
        },
        error: (error) => {
          console.error('Unable to load admin fraud pulse:', error);
          this.notificationCount.set(0);
        }
      });
  }
}
