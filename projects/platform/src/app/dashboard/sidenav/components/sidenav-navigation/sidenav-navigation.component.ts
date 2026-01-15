import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { NavigationItem } from '../../sidenav.component';

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
  template: `
    <nav class="nav-tree">
      @for (item of navigationItems; track item.label) {
        <div class="nav-item top-level">
          @if (item.route && !item.children) {
            <!-- Regular route link -->
            <a 
              class="nav-link" 
              [routerLink]="item.route" 
              routerLinkActive="active-link"
              [routerLinkActiveOptions]="{exact: true}"
              (click)="onNavItemClick()">
              <div class="nav-item-header" [class.active]="isRouteActive(item.route)">
                <div class="nav-header-content">
                  <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                  <span class="nav-label">{{item.label}}</span>
                </div>
                @if (item.badge && item.badge > 0) {
                  <div class="nav-badge">
                    <span class="badge" [class]="item.badgeColor || 'primary'">
                      {{item.badge}}
                    </span>
                  </div>
                }
              </div>
            </a>
          } @else if (item.modalAction && !item.children) {
            <!-- Modal action link -->
            <div 
              class="nav-link modal-link" 
              (click)="onModalActionClick(item.modalAction)">
              <div class="nav-item-header">
                <div class="nav-header-content">
                  <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                  <span class="nav-label">{{item.label}}</span>
                </div>
                @if (item.badge && item.badge > 0) {
                  <div class="nav-badge">
                    <span class="badge" [class]="item.badgeColor || 'primary'">
                      {{item.badge}}
                    </span>
                  </div>
                }
              </div>
            </div>
          } @else {
            <!-- Parent item with children -->
            <div 
              class="nav-item-header" 
              [class.active]="isItemActive(item)"
              (click)="toggleItem(item)">
              <div class="nav-header-content">
                <mat-icon class="nav-icon">{{item.icon}}</mat-icon>
                <span class="nav-label">{{item.label}}</span>
              </div>
              <div class="nav-header-actions">
                @if (item.badge && item.badge > 0) {
                  <div class="nav-badge">
                    <span class="badge" [class]="item.badgeColor || 'primary'">
                      {{item.badge}}
                    </span>
                  </div>
                }
                @if (item.children && item.children.length > 0) {
                  <mat-icon class="nav-arrow" [class.expanded]="item.expanded">
                    chevron_right
                  </mat-icon>
                }
              </div>
            </div>
            
            @if (item.children && item.children.length > 0) {
              <div 
                class="nav-children" 
                [class.expanded]="item.expanded">
                @for (child of item.children; track child.label) {
                  <div class="nav-item level-2">
                    @if (child.route && !child.children) {
                      <!-- Child regular route link -->
                      <a 
                        class="nav-link" 
                        [routerLink]="child.route" 
                        routerLinkActive="active-link"
                        (click)="onNavItemClick()">
                        <div class="nav-item-header" [class.active]="isRouteActive(child.route)">
                          <div class="nav-header-content">
                            <mat-icon class="nav-icon">{{child.icon}}</mat-icon>
                            <span class="nav-label">{{child.label}}</span>
                          </div>
                          @if (child.badge && child.badge > 0) {
                            <div class="nav-badge">
                              <span class="badge" [class]="child.badgeColor || 'primary'">
                                {{child.badge}}
                              </span>
                            </div>
                          }
                        </div>
                      </a>
                    } @else if (child.modalAction && !child.children) {
                      <!-- Child modal action link -->
                      <div 
                        class="nav-link modal-link" 
                        (click)="onModalActionClick(child.modalAction)">
                        <div class="nav-item-header">
                          <div class="nav-header-content">
                            <mat-icon class="nav-icon">{{child.icon}}</mat-icon>
                            <span class="nav-label">{{child.label}}</span>
                          </div>
                          @if (child.badge && child.badge > 0) {
                            <div class="nav-badge">
                              <span class="badge" [class]="child.badgeColor || 'primary'">
                                {{child.badge}}
                              </span>
                            </div>
                          }
                        </div>
                      </div>
                    } @else {
                      <!-- Child parent item with children -->
                      <div 
                        class="nav-item-header" 
                        [class.active]="isItemActive(child)"
                        (click)="toggleItem(child)">
                        <div class="nav-header-content">
                          <mat-icon class="nav-icon">{{child.icon}}</mat-icon>
                          <span class="nav-label">{{child.label}}</span>
                        </div>
                        <div class="nav-header-actions">
                          @if (child.badge && child.badge > 0) {
                            <div class="nav-badge">
                              <span class="badge" [class]="child.badgeColor || 'primary'">
                                {{child.badge}}
                              </span>
                            </div>
                          }
                          @if (child.children && child.children.length > 0) {
                            <mat-icon class="nav-arrow" [class.expanded]="child.expanded">
                              chevron_right
                            </mat-icon>
                          }
                        </div>
                      </div>
                      
                      @if (child.children && child.children.length > 0) {
                        <div 
                          class="nav-children" 
                          [class.expanded]="child.expanded">
                          @for (grandChild of child.children; track grandChild.label) {
                            <div class="nav-item level-3">
                              @if (grandChild.route && !grandChild.children) {
                                <!-- Grandchild regular route link -->
                                <a 
                                  class="nav-link" 
                                  [routerLink]="grandChild.route" 
                                  routerLinkActive="active-link"
                                  (click)="onNavItemClick()">
                                  <div class="nav-item-header" [class.active]="isRouteActive(grandChild.route)">
                                    <div class="nav-header-content">
                                      <mat-icon class="nav-icon">{{grandChild.icon}}</mat-icon>
                                      <span class="nav-label">{{grandChild.label}}</span>
                                    </div>
                                    @if (grandChild.badge && grandChild.badge > 0) {
                                      <div class="nav-badge">
                                        <span class="badge" [class]="grandChild.badgeColor || 'primary'">
                                          {{grandChild.badge}}
                                        </span>
                                      </div>
                                    }
                                  </div>
                                </a>
                              } @else if (grandChild.modalAction && !grandChild.children) {
                                <!-- Grandchild modal action link -->
                                <div 
                                  class="nav-link modal-link" 
                                  (click)="onModalActionClick(grandChild.modalAction)">
                                  <div class="nav-item-header">
                                    <div class="nav-header-content">
                                      <mat-icon class="nav-icon">{{grandChild.icon}}</mat-icon>
                                      <span class="nav-label">{{grandChild.label}}</span>
                                    </div>
                                    @if (grandChild.badge && grandChild.badge > 0) {
                                      <div class="nav-badge">
                                        <span class="badge" [class]="grandChild.badgeColor || 'primary'">
                                          {{grandChild.badge}}
                                        </span>
                                      </div>
                                    }
                                  </div>
                                </div>
                              }
                            </div>
                          }
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
      }
    </nav>
  `,
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
        item.children.forEach(child => {
          child.expanded = child.expanded || false;
          if (child.children) {
            child.children.forEach(grandChild => {
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