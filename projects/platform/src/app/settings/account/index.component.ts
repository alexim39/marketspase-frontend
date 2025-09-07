import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit, ViewChild, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { HelpDialogComponent, UserInterface } from '../../../../../shared-services/src/public-api';

@Component({
  selector: 'settings-index',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  template: `
    <div class="settings-container">
      <!-- Header Section -->
      <header class="settings-header">
        <nav class="breadcrumb">
          <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="scrollToTop()">
            <mat-icon>home</mat-icon> Dashboard
          </a>
          <mat-icon>chevron_right</mat-icon>
          <a>Settings</a>
          <mat-icon>chevron_right</mat-icon>
          <span class="current">Account Settings</span>
        </nav>

        <div class="header-content">
          <h1>
            <mat-icon class="header-icon">account_circle</mat-icon>
            Account Settings
            <button mat-icon-button class="help-button" (click)="showDescription()" matTooltip="Help" aria-label="Help">
              <mat-icon>help_outline</mat-icon>
            </button>
          </h1>
          <p>Manage your MarketSpase account information</p>
        </div>
      </header>

      <!-- Main Content Area -->
      <div class="settings-wrapper">
        <mat-sidenav-container class="sidenav-container">
          <!-- Mobile Menu Toggle -->
          <mat-toolbar class="mobile-toolbar" *ngIf="isMobile">
            <span class="toolbar-spacer"></span>
            <button mat-stroked-button (click)="drawer.toggle()" class="menu-toggle" aria-label="Toggle menu">
              <mat-icon>menu</mat-icon>
              Settings Menu
              <mat-icon class="notification-dot" *ngIf="hasNotifications" matBadge="!" matBadgeColor="warn" matBadgeSize="small">notifications</mat-icon>
            </button>
          </mat-toolbar>

          <!-- Main Content -->
          <main class="main-content">
            <router-outlet/>
          </main>

          <!-- Enhanced Side Navigation -->
          <mat-sidenav #drawer mode="side" position="end" class="settings-sidenav" 
                     [opened]="!isMobile" [fixedInViewport]="isMobile" 
                     [fixedTopGap]="isMobile ? 64 : 0">
            
            <!-- Sidenav Header with User Profile -->
            <div class="sidenav-header">
              <div class="sidenav-title-container">
                <div class="title-with-status">
                  <h3>Quick Settings</h3>
                  <div class="status-indicator" [class.online]="isOnline" matTooltip="{{isOnline ? 'Online' : 'Offline'}}">
                    <div class="status-dot"></div>
                    <span class="status-text">{{isOnline ? 'Online' : 'Offline'}}</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- Quick Actions Bar -->
            <div class="quick-actions-bar">
               <a mat-mini-fab class="quick-action-btn theme-toggle" routerLink="./account">
                <mat-icon>account_box</mat-icon>
              </a>

               <a mat-mini-fab class="quick-action-btn notifications-toggle" routerLink="./system">
                <mat-icon>notifications</mat-icon>
              </a>

              <!-- <a mat-mini-fab class="quick-action-btn sync-btn" 
                      (click)="syncData()" 
                      matTooltip="Sync Data"
                      [class.syncing]="isSyncing">
                <mat-icon>{{isSyncing ? 'sync' : 'cloud_sync'}}</mat-icon>
              </a> -->

              <a mat-mini-fab class="quick-action-btn backup-btn" routerLink="./share">
                <mat-icon>share</mat-icon>
              </a>
            </div>

            <!-- Navigation List -->
            <div class="nav-content">
              <mat-nav-list class="settings-nav-list">
                <!-- Account Section -->
                <div class="nav-section">
                  <div class="nav-section-header">
                    <a class="nav-section-label" routerLink="./account" routerLinkActive="active" (click)="closeMobileMenu()">
                      <mat-icon>account_circle</mat-icon>
                      ACCOUNT
                    </a>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- System Section -->
                <div class="nav-section">
                  <div class="nav-section-header">
                    <a class="nav-section-label" routerLink="./system" routerLinkActive="active" (click)="closeMobileMenu()">
                      <mat-icon>tune</mat-icon>
                      SYSTEM
                    </a>
                  </div>
                </div>

                <mat-divider></mat-divider>

                <!-- Support Section -->
                <div class="nav-section">
                  <div class="nav-section-header">
                    <a class="nav-section-label" routerLink="./share" routerLinkActive="active" (click)="closeMobileMenu()">
                      <mat-icon>support</mat-icon>
                      SUPPORT
                    </a>
                  </div>
                </div>
              </mat-nav-list>

              <!-- Recent Activity -->
              <!-- <div class="recent-activity">
                <div class="activity-header">
                  <mat-icon>history</mat-icon>
                  <span>Recent Activity</span>
                </div>
                <div class="activity-list">
                  <div class="activity-item" *ngFor="let activity of recentActivities">
                    <div class="activity-icon">
                      <mat-icon>{{activity.icon}}</mat-icon>
                    </div>
                    <div class="activity-content">
                      <div class="activity-title">{{activity.title}}</div>
                      <div class="activity-time">{{activity.time}}</div>
                    </div>
                  </div>
                </div>
              </div> -->
            </div>

            <!-- Footer -->
            <div class="sidenav-footer">
              <!-- <div class="footer-stats">
                <div class="stat-item">
                  <mat-icon>storage</mat-icon>
                  <span>{{storageUsed}}GB / {{storageTotal}}GB</span>
                  <div class="stat-bar">
                    <div class="stat-fill" [style.width.%]="(storageUsed/storageTotal)*100"></div>
                  </div>
                </div>
              </div> -->
              
              <!-- <div class="footer-actions">
                <button mat-stroked-button class="export-button" matTooltip="Export Settings">
                  <mat-icon>download</mat-icon>
                  Export
                </button>
                <button mat-raised-button class="logout-button">
                  <mat-icon>logout</mat-icon>
                  Sign Out
                </button>
              </div> -->
            </div>
          </mat-sidenav>
        </mat-sidenav-container>
      </div>
    </div>
  `,
  styleUrls: ['./index.component.scss']
})
export class SettingsIndexComponent implements OnInit {
  readonly dialog = inject(MatDialog);
  @Input() user!: UserInterface;
  @ViewChild('drawer') drawer!: MatSidenav;
  private router = inject(Router);

  // Enhanced Properties
  isMobile = false;
  isOnline = true;
  showSearch = false;
  //isDarkMode = false;
  //notificationsEnabled = true;
  //isSyncing = false;
  hasNotifications = true;
  unreadNotifications = 3;
  connectedIntegrations = 5;
  currentRating = 4;
  securityScore = 85;
  storageUsed = 2.4;
  storageTotal = 15;
  defaultAvatar = 'assets/images/default-avatar.png';

  // Completion Status
  completionStatus = {
    profile: 85,
    security: 92,
    billing: 100
  };

  // Expandable Sections
  expandedSections = {
    account: true,
    system: true,
    support: false
  };

  // Recent Activities
  recentActivities = [
    {
      icon: 'security',
      title: 'Password updated',
      time: '2 hours ago'
    },
    {
      icon: 'notifications',
      title: 'Notifications enabled',
      time: '1 day ago'
    },
    {
      icon: 'payment',
      title: 'Billing updated',
      time: '3 days ago'
    }
  ];

  @HostListener('window:online', ['$event'])
  onOnline(event: Event) {
    this.isOnline = true;
  }

  @HostListener('window:offline', ['$event'])
  onOffline(event: Event) {
    this.isOnline = false;
  }

  ngOnInit() {

    // Initialize online status
   // this.isOnline = navigator.onLine;
  }

  showDescription() {
    this.dialog.open(HelpDialogComponent, {
      data: { help: 'In this section, you can set up your profile details and manage your account settings with our enhanced interface.' },
      panelClass: 'help-dialog'
    });
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 300);
    }
  }



  toggleSection(section: string) {
    this.expandedSections = {
      ...this.expandedSections,
      [section]: !this.expandedSections[section as keyof typeof this.expandedSections]
    };
  }

  getCompletionCircle(percentage: number): string {
    const circumference = 2 * Math.PI * 15.9155;
    const offset = circumference - (percentage / 100) * circumference;
    return `${circumference} ${circumference}`;
  }

  getSecurityIcon(): string {
    if (this.securityScore >= 80) return 'shield';
    if (this.securityScore >= 60) return 'verified_user';
    return 'warning';
  }

  contactSupport() {
    // Implement contact support functionality
    console.log('Opening support chat...');
  }

  editProfile() {
    this.router.navigate(['/settings/account']);
    this.closeMobileMenu();
  }

  changeAvatar() {
    // Implement avatar change functionality
    console.log('Changing avatar...');
  }

  viewProfile() {
    // Implement view profile functionality
    console.log('Viewing public profile...');
  }

  accountSettings() {
    this.router.navigate(['/settings/account']);
    this.closeMobileMenu();
  }

  closeMobileMenu() {
    if (this.isMobile && this.drawer) {
      this.drawer.close();
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}