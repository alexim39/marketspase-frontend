import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { NavigationItem } from '../../navigation';
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
export class SidenavNavigationComponent implements OnInit {
  @Input() navigationItems: NavigationItem[] = [];
  @Output() navItemClick = new EventEmitter<void>();
  @Output() modalAction = new EventEmitter<string>(); // New output for modal actions

  ngOnInit() {
    // Ensure all items have expanded property
    this.navigationItems.forEach(item => {
      item.expanded = item.expanded || false;
      if (item.children) {
        item.children.forEach((child: NavigationItem) => {
          child.expanded = child.expanded || false;
          if (child.children) {
            child.children.forEach((grandChild: NavigationItem) => {
              grandChild.expanded = grandChild.expanded || false;
            });
          }
        });
      }
    });
  }

  toggleItem(item: NavigationItem): void {
    if (item.children && item.children.length > 0) {
      item.expanded = !item.expanded;
    }
  }

  isRouteActive(route: string | undefined): boolean {
    if (!route) return false;
    const routePath = route.split('?')[0];
    return window.location.pathname.startsWith(routePath);
  }

  isItemActive(item: NavigationItem): boolean {
    if (item.route && this.isRouteActive(item.route)) {
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