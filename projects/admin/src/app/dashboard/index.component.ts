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
import { ADMIN_MENU_ITEMS, MenuItem, SearchResultItem } from './navigation/admin-navigation';

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

  menuItems = signal<MenuItem[]>(ADMIN_MENU_ITEMS);

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
        '/dashboard/leads': 'ads',
        '/dashboard/metrics': 'ads',
        '/dashboard/promotions': 'ads',
        '/dashboard/stores': 'storefront',
        '/dashboard/financial': 'payments',
        '/dashboard/community': 'community',
        '/dashboard/posts': 'community',
        '/dashboard/newletters': 'community',
        '/dashboard/newsletters': 'community',
        '/dashboard/disputes': 'community',
        '/dashboard/engagements': 'community',
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
