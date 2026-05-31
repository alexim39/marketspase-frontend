import { Component, Input, Output, EventEmitter, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { NavigationItem } from '../../navigation';
import { filter } from 'rxjs';
@Component({
  selector: 'app-sidenav-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule
  ],
  templateUrl: `./sidenav-navigation.component.html`,
  styleUrls: [`./sidenav-navigation.component.scss`]
})
export class SidenavNavigationComponent implements OnInit, OnChanges {
  @Input() navigationItems: NavigationItem[] = [];
  @Output() navItemClick = new EventEmitter<void>();
  @Output() modalAction = new EventEmitter<string>(); // New output for modal actions

  private readonly router = inject(Router);
  private currentPath = '';
  private flatRoutes: string[] = [];
  private bestRoute: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['navigationItems']) {
      this.flatRoutes = this.flattenRoutes(this.navigationItems);
      this.bestRoute = this.computeBestMatchingRoute();
      this.ensureExpandedFlags(this.navigationItems);
    }
  }

  ngOnInit() {
    this.currentPath = this.normalisePath(this.router.url);
    this.flatRoutes = this.flattenRoutes(this.navigationItems);
    this.bestRoute = this.computeBestMatchingRoute();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentPath = this.normalisePath(this.router.url);
        this.bestRoute = this.computeBestMatchingRoute();
      });

    this.ensureExpandedFlags(this.navigationItems);
  }

  private ensureExpandedFlags(items: NavigationItem[]): void {
    items.forEach(item => {
      item.expanded = item.expanded || false;
      if (item.children?.length) {
        this.ensureExpandedFlags(item.children);
      }
    });
  }

  toggleItem(item: NavigationItem): void {
    if (item.children && item.children.length > 0) {
      item.expanded = !item.expanded;
    }
  }

  isRouteActive(route: string | undefined): boolean {
    return this.isRouteActiveWithMode(route, 'best');
  }

  isRouteActiveWithMode(route: string | undefined, mode: 'exact' | 'prefix' | 'best' = 'best'): boolean {
    if (!route) return false;
    const routePath = this.normalisePath(route);

    if (mode === 'exact') return this.currentPath === routePath;
    if (mode === 'prefix') return this.currentPath === routePath || this.currentPath.startsWith(`${routePath}/`);

    // "best" match: only the most-specific route (longest prefix) is considered active,
    // plus its ancestors via isItemActive().
    return this.bestRoute === routePath;
  }

  private flattenRoutes(items: NavigationItem[]): string[] {
    const routes: string[] = [];
    const collect = (list: NavigationItem[]) => {
      for (const item of list) {
        if (item.route) routes.push(this.normalisePath(item.route));
        if (item.children?.length) collect(item.children);
      }
    };
    collect(items);
    return routes;
  }

  private computeBestMatchingRoute(): string | null {
    let best: string | null = null;
    for (const route of this.flatRoutes) {
      if (this.currentPath === route || this.currentPath.startsWith(`${route}/`)) {
        if (!best || route.length > best.length) best = route;
      }
    }
    return best;
  }

  private normalisePath(routeOrUrl: string): string {
    const path = String(routeOrUrl || '').split('?')[0].split('#')[0].trim();
    if (!path) return '/';
    // Ensure leading slash and no trailing slash (except root).
    const withSlash = path.startsWith('/') ? path : `/${path}`;
    if (withSlash.length > 1 && withSlash.endsWith('/')) return withSlash.slice(0, -1);
    return withSlash;
  }

  isItemActive(item: NavigationItem): boolean {
    if (item.route && this.isRouteActiveWithMode(item.route, item.children?.length ? 'prefix' : 'best')) {
      return true;
    }
    
    if (item.children) {
      for (const child of item.children) {
        if (this.isItemActive(child)) {
          item.expanded = true;
          return true;
        }
      }
    }
    
    return false;
  }

  onModalActionClick(action: string): void {
    this.modalAction.emit(action);
    this.onNavItemClick(); // Close mobile sidenav if applicable
  }

  onNavItemClick(): void {
    this.navItemClick.emit();
  }
}
