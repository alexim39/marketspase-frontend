import { Component, Input, Signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';

interface NavigationItem {
  icon: string;
  label: string;
  route: string;
  badge?: Signal<number>;
}

@Component({
  selector: 'app-sidenav-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatBadgeModule
  ],
  template: `
    <mat-nav-list class="nav-list">
      @for (item of navigationItems(); track item) {
        <mat-list-item [routerLink]="item.route" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="navItemClick.emit()">
          <mat-icon matListItemIcon>{{item.icon}}</mat-icon>
          <span matListItemTitle>{{item.label}}</span>
        </mat-list-item>
      }
    </mat-nav-list>
  `,
  styleUrls: ['./sidenav-navigation.component.scss']
})
export class SidenavNavigationComponent {
  @Input({ required: true }) navigationItems!: Signal<NavigationItem[]>;
  @Output() navItemClick = new EventEmitter<void>();
}