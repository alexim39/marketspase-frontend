import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, Signal, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { User as FirebaseAuthUser } from '@angular/fire/auth'; // Import the Firebase User type
import { UserInterface, UserService } from '../common/services/user.service';

// Interfaces
export interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: number;
  spent: number;
  reach: number;
  engagement: number;
  status: 'active' | 'pending' | 'completed' | 'paused';
  category: string;
  deadline: Date;
  imageUrl: string;
  targetAudience: string;
  createdAt: Date;
  promoters: number;
  viewsRequired: number;
  currentViews: number;
}

export interface Earning {
  id: string;
  campaignTitle: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  date: Date;
  proofSubmitted: boolean;
  advertiser: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'advertiser' | 'promoter';
  verified: boolean;
  rating: number;
  totalEarnings?: number;
  totalSpent?: number;
  activeCampaigns?: number;
  completedCampaigns?: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatTooltipModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- Mobile Header -->
       @if (isMobile()) {
        <mat-toolbar class="mobile-header">
          <button mat-icon-button (click)="toggleSidenav()">
            <mat-icon>menu</mat-icon>
          </button>
          <div class="mobile-logo">
            <mat-icon class="logo-icon">campaign</mat-icon>
            <span class="logo-text">MarketSpase</span>
          </div>
          <div class="mobile-actions">
            <button mat-icon-button [matMenuTriggerFor]="notificationMenu" class="notification-btn">
              <mat-icon matBadge="{{unreadNotifications()}}" matBadgeColor="warn" [matBadgeHidden]="unreadNotifications() === 0">notifications</mat-icon>
            </button>
            <button mat-icon-button [matMenuTriggerFor]="profileMenu">
              <img [src]="user()!.avatar" class="avatar-sm" [alt]="user()!.displayName ">
            </button>
          </div>
        </mat-toolbar>
       }

      <mat-sidenav-container class="sidenav-container" [hasBackdrop]="isMobile()">
        <!-- Side Navigation -->
        <mat-sidenav #sidenav [mode]="isMobile() ? 'over' : 'side'" [opened]="!isMobile()" class="sidenav">
          <!-- Desktop Header in Sidenav -->
           @if (!isMobile()) {
            <div class="sidenav-header">
              <div class="logo-section">
                <mat-icon class="logo-icon">campaign</mat-icon>
                <h1 class="logo-text">MarketSpase</h1>
              </div>
            </div>
           }

          <!-- User Profile Card -->
          <div class="profile-card">
            <div class="profile-info">
              <img [src]="user()!.avatar" class="profile-avatar" [alt]="user()!.displayName">
              <div class="profile-details">
                <h3 class="profile-name">{{user()!.displayName}}</h3>
                <div class="profile-meta">
                  <mat-chip class="role-chip" [class]="user()!.role">
                    {{user()!.role | titlecase}}
                  </mat-chip>
                  @if (user()!.verified) {
                    <mat-icon class="verified-badge" matTooltip="Verified Account">verified</mat-icon>
                  }
                </div>
                <div class="profile-stats">
                  @if (user()!.role === 'promoter') {
                    ⭐ {{user()!.rating}}/5 • ₦{{currentUser().totalEarnings | number}} earned
                  }
                  @if (user()!.role === 'advertiser') {
                    {{currentUser().activeCampaigns}} active • ₦{{currentUser().totalSpent | number}} spent
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Menu -->
          <mat-nav-list class="nav-list">
          @for (item of navigationItems(); track item) {
            <mat-list-item [routerLink]="item.route" routerLinkActive="active-nav-item" (click)="isMobile() && sidenav.close()">
              <mat-icon matListItemIcon>{{item.icon}}</mat-icon>
              <span matListItemTitle>{{item.label}}</span>
            @if (item.badge) {
              <mat-icon matListItemMeta class="badge-icon" [matBadge]="item.badge" matBadgeColor="warn" matBadgeSize="small"></mat-icon>
            }
            </mat-list-item>
          }
          </mat-nav-list>

          <!-- Quick Actions -->
           @if (user()!.role === 'advertiser') {
            <div class="quick-actions">
              <h4 class="section-title">Quick Actions</h4>
              <button mat-stroked-button class="action-btn" (click)="createCampaign()">
                <mat-icon>add_circle_outline</mat-icon>
                Create Campaign
              </button>
              <button mat-stroked-button class="action-btn" (click)="fundWallet()">
                <mat-icon>account_balance_wallet</mat-icon>
                Fund Wallet
              </button>
            </div>
           }
          <!-- Logout -->
          <div class="sidenav-footer">
            <mat-divider></mat-divider>
            <mat-list-item (click)="logout()">
              <mat-icon matListItemIcon>exit_to_app</mat-icon>
              <span matListItemTitle>Logout</span>
            </mat-list-item>
          </div>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="main-content">
          <!-- Desktop Header -->
          @if (!isMobile()) {
            <mat-toolbar class="desktop-header">
              <span class="page-title">{{getPageTitle()}}</span>
              <div class="header-spacer"></div>
              <div class="header-actions">
                <!-- Wallet Balance -->
                <div class="wallet-display" (click)="openWallet()">
                  <mat-icon>account_balance_wallet</mat-icon>
                  <span class="wallet-amount">₦{{walletBalance() | number}}</span>
                </div>
                
                <!-- Notifications -->
                <button mat-icon-button [matMenuTriggerFor]="notificationMenu" class="notification-btn">
                  <mat-icon matBadge="{{unreadNotifications()}}" matBadgeColor="warn" 
                            [matBadgeHidden]="unreadNotifications() === 0">notifications</mat-icon>
                </button>

                <!-- Profile Menu -->
                <button mat-icon-button [matMenuTriggerFor]="profileMenu">
                  <img [src]="user()!.avatar" class="avatar-sm" [alt]="user()!.displayName">
                </button>
              </div>
            </mat-toolbar>
          }

          <!-- Dashboard Content -->
          <div class="dashboard-content">
            <!-- Overview Cards -->
            <div class="overview-section">
              <div class="stats-grid">
                @for (stat of dashboardStats(); track stat) {
                <mat-card class="stat-card" [class]="stat.trend + '-trend'">
                  <mat-card-content>
                    <div class="stat-header">
                      <mat-icon class="stat-icon" [style.color]="stat.color">{{stat.icon}}</mat-icon>
                      <div class="stat-trend" [class]="stat.trend">
                        <mat-icon>{{stat.trend === 'up' ? 'trending_up' : 'trending_down'}}</mat-icon>
                        <span>{{stat.change}}%</span>
                      </div>
                    </div>
                    <div class="stat-content">
                      <h2 class="stat-value">{{stat.value}}</h2>
                      <p class="stat-label">{{stat.label}}</p>
                    </div>
                  </mat-card-content>
                </mat-card>
                }
              </div>
            </div>

            <!-- Quick Actions Bar (Mobile) -->
             @if (isMobile() && user()!.role === 'advertiser') {
              <div class="mobile-quick-actions">
                <button mat-fab extended color="primary" (click)="createCampaign()">
                  <mat-icon>add</mat-icon>
                  Create Campaign
                </button>
              </div>
             }

            <!-- Main Dashboard Content -->
            <div class="content-sections">
              <!-- Advertiser Dashboard -->
              @if (user()!.role === 'advertiser') {
                <div>
                  <mat-tab-group class="dashboard-tabs" animationDuration="300ms">
                    <!-- Active Campaigns Tab -->
                    <mat-tab label="Active Campaigns" class="tab-content">
                      <div class="campaigns-section">
                        <div class="section-header">
                          <h3>Your Campaigns</h3>
                          <button mat-stroked-button (click)="createCampaign()">
                            <mat-icon>add</mat-icon>
                            New Campaign
                          </button>
                        </div>
                        
                        <div class="campaigns-grid">
                          @for (campaign of campaigns(); track campaign) {
                          <mat-card class="campaign-card" [class]="'status-' + campaign.status">
                            <div class="campaign-image">
                              <img [src]="campaign.imageUrl" [alt]="campaign.title">
                              <div class="campaign-status">
                                <mat-chip [class]="'status-' + campaign.status">
                                  {{campaign.status | titlecase}}
                                </mat-chip>
                              </div>
                            </div>
                            
                            <mat-card-content>
                              <div class="campaign-header">
                                <h4 class="campaign-title">{{campaign.title}}</h4>
                                <button mat-icon-button [matMenuTriggerFor]="campaignMenu">
                                  <mat-icon>more_vert</mat-icon>
                                </button>
                              </div>
                              
                              <p class="campaign-description">{{campaign.description}}</p>
                              
                              <div class="campaign-metrics">
                                <div class="metric">
                                  <span class="metric-label">Reach</span>
                                  <span class="metric-value">{{campaign.reach | number}}</span>
                                </div>
                                <div class="metric">
                                  <span class="metric-label">Budget</span>
                                  <span class="metric-value">₦{{campaign.budget | number}}</span>
                                </div>
                                <div class="metric">
                                  <span class="metric-label">Spent</span>
                                  <span class="metric-value">₦{{campaign.spent | number}}</span>
                                </div>
                              </div>
                              
                              <div class="campaign-progress">
                                <div class="progress-info">
                                  <span class="progress-label">Progress</span>
                                  <span class="progress-text">{{campaign.currentViews}}/{{campaign.viewsRequired}} views</span>
                                </div>
                                <mat-progress-bar mode="determinate" [value]="(campaign.currentViews / campaign.viewsRequired) * 100">
                                </mat-progress-bar>
                              </div>
                            </mat-card-content>
                            
                            <mat-card-actions>
                              <button mat-button (click)="viewCampaign(campaign.id)">View Details</button>
                              <button mat-button (click)="viewProofs(campaign.id)">View Proofs</button>
                            </mat-card-actions>
                          </mat-card>
                          }
                        </div>
                      </div>
                    </mat-tab>

                    <!-- Analytics Tab -->
                    <mat-tab label="Analytics">
                      <div class="analytics-section">
                        <h3>Campaign Analytics</h3>
                        <!-- Add charts and analytics here -->
                        <div class="analytics-placeholder">
                          <mat-icon>analytics</mat-icon>
                          <p>Detailed analytics coming soon</p>
                        </div>
                      </div>
                    </mat-tab>

                    <!-- History Tab -->
                    <mat-tab label="History">
                      <div class="history-section">
                        <h3>Campaign History</h3>
                        <!-- Add campaign history table here -->
                        <div class="history-placeholder">
                          <mat-icon>history</mat-icon>
                          <p>Campaign history will be displayed here</p>
                        </div>
                      </div>
                    </mat-tab>
                  </mat-tab-group>
                </div>
              }

              <!-- Promoter Dashboard -->
               @if (user()!.role === 'promoter') {
              <div>
                <mat-tab-group class="dashboard-tabs" animationDuration="300ms">
                  <!-- Available Campaigns Tab -->
                  <mat-tab label="Available Campaigns">
                    <div class="available-campaigns-section">
                      <div class="section-header">
                        <h3>Available Campaigns</h3>
                        <div class="filters">
                          <button mat-stroked-button>
                            <mat-icon>filter_list</mat-icon>
                            Filter
                          </button>
                        </div>
                      </div>
                      
                      <div class="campaigns-grid">
                        @for (campaign of campaigns(); track campaign) {
                          <mat-card class="campaign-card available" (click)="viewCampaignDetails(campaign.id)">
                            <div class="campaign-image">
                              <img [src]="campaign.imageUrl" [alt]="campaign.title">
                              <div class="campaign-reward">
                                <mat-chip color="primary">₦{{campaign.budget / campaign.promoters | number}}</mat-chip>
                              </div>
                            </div>
                            
                            <mat-card-content>
                              <h4 class="campaign-title">{{campaign.title}}</h4>
                              <p class="campaign-description">{{campaign.description}}</p>
                              
                              <div class="campaign-info">
                                <div class="info-item">
                                  <mat-icon>schedule</mat-icon>
                                  <span>{{campaign.deadline | date:'short'}}</span>
                                </div>
                                <div class="info-item">
                                  <mat-icon>people</mat-icon>
                                  <span>{{campaign.promoters}} promoters needed</span>
                                </div>
                              </div>
                            </mat-card-content>
                            
                            <mat-card-actions>
                              <button mat-stroked-button color="primary" (click)="acceptCampaign(campaign.id)">
                                Accept Campaign
                              </button>
                            </mat-card-actions>
                          </mat-card>
                        }
                      </div>
                    </div>
                  </mat-tab>

                  <!-- My Campaigns Tab -->
                  <mat-tab label="My Campaigns">
                    <div class="my-campaigns-section">
                      <h3>Your Active Campaigns</h3>
                      
                      <div class="campaigns-list">
                        @for (earning of earnings(); track earning) {
                        <mat-card class="campaign-item">
                          <mat-card-content>
                            <div class="campaign-summary">
                              <div class="campaign-info">
                                <h4>{{earning.campaignTitle}}</h4>
                                <p>{{earning.advertiser}}</p>
                              </div>
                              <div class="campaign-status">
                                <mat-chip [class]="'status-' + earning.status">
                                  {{earning.status | titlecase}}
                                </mat-chip>
                                <span class="earning-amount">₦{{earning.amount | number}}</span>
                              </div>
                            </div>
                            
                            @if (earning.status === 'pending') {
                              <div class="proof-status">
                                @if (!earning.proofSubmitted) {
                                  <button mat-stroked-button color="primary" (click)="uploadProof(earning.id)">
                                    <mat-icon>upload</mat-icon>
                                    Upload Proof
                                  </button>
                                }
                                @if (earning.proofSubmitted) {
                                  <div class="proof-submitted">
                                    <mat-icon color="primary">check_circle</mat-icon>
                                    <span>Proof submitted, awaiting verification</span>
                                  </div>
                                }
                              </div>
                            }
                          </mat-card-content>
                        </mat-card>
                        }
                      </div>
                    </div>
                  </mat-tab>

                  <!-- Earnings Tab -->
                  <mat-tab label="Earnings">
                    <div class="earnings-section">
                      <div class="earnings-header">
                        <h3>Your Earnings</h3>
                        <button mat-raised-button color="primary" (click)="withdraw()">
                          <mat-icon>money</mat-icon>
                          Withdraw
                        </button>
                      </div>
                      
                      <div class="earnings-summary">
                        <mat-card class="earning-stat">
                          <mat-card-content>
                            <h3>₦{{currentUser().totalEarnings | number}}</h3>
                            <p>Total Earnings</p>
                          </mat-card-content>
                        </mat-card>
                        
                        <mat-card class="earning-stat">
                          <mat-card-content>
                            <h3>₦{{pendingEarnings() | number}}</h3>
                            <p>Pending</p>
                          </mat-card-content>
                        </mat-card>
                        
                        <mat-card class="earning-stat">
                          <mat-card-content>
                            <h3>₦{{availableBalance() | number}}</h3>
                            <p>Available</p>
                          </mat-card-content>
                        </mat-card>
                      </div>
                    </div>
                  </mat-tab>
                </mat-tab-group>
              </div>
              }
            </div>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>

      <!-- Notification Menu -->
      <mat-menu #notificationMenu="matMenu" class="notification-menu">
        <div class="notification-header">
          <h4>Notifications</h4>
          <button mat-icon-button (click)="markAllAsRead()">
            <mat-icon>done_all</mat-icon>
          </button>
        </div>
        <mat-divider></mat-divider>
        @if (notifications().length > 0) {
        <div class="notification-list">
          <button mat-menu-item 
                  *ngFor="let notification of notifications().slice(0, 5)" 
                  class="notification-item"
                  [class.unread]="!notification.read"
                  (click)="markAsRead(notification.id)">
            <div class="notification-content">
              <div class="notification-title">{{notification.title}}</div>
              <div class="notification-message">{{notification.message}}</div>
              <div class="notification-time">{{notification.timestamp | date:'short'}}</div>
            </div>
          </button>
        </div>
        } @else {
          <div class="no-notifications">
            <mat-icon>notifications_none</mat-icon>
            <p>No new notifications</p>
          </div>
        }
        @if (notifications().length > 5) {
          <mat-divider></mat-divider>
        }
        @if (notifications().length > 5) {
          <button mat-menu-item (click)="viewAllNotifications()">
            View all notifications
          </button>
        }
      </mat-menu>

      <!-- Profile Menu -->
      <mat-menu #profileMenu="matMenu">
        <button mat-menu-item (click)="viewProfile()">
          <mat-icon>person</mat-icon>
          <span>Profile</span>
        </button>
        <button mat-menu-item (click)="openSettings()">
          <mat-icon>settings</mat-icon>
          <span>Settings</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon>exit_to_app</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>

      <!-- Campaign Menu -->
      <mat-menu #campaignMenu="matMenu">
        <button mat-menu-item>
          <mat-icon>edit</mat-icon>
          <span>Edit Campaign</span>
        </button>
        <button mat-menu-item>
          <mat-icon>pause</mat-icon>
          <span>Pause Campaign</span>
        </button>
        <button mat-menu-item>
          <mat-icon>analytics</mat-icon>
          <span>View Analytics</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item>
          <mat-icon>delete</mat-icon>
          <span>Delete Campaign</span>
        </button>
      </mat-menu>
    </div>
  `,
  styles: [`
    .dashboard-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #f5f7fa;
    }

    /* Mobile Header */
    .mobile-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      z-index: 1000;
    }

    .mobile-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .logo-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 600;
    }

    .mobile-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Sidenav */
    .sidenav-container {
      flex: 1;
    }

    .sidenav {
      width: 320px;
      background: white;
      border-right: 1px solid #e0e4e7;
    }

    .sidenav-header {
      padding: 24px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-section .logo-text {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }

    /* Profile Card */
    .profile-card {
      padding: 20px;
      border-bottom: 1px solid #e0e4e7;
    }

    .profile-info {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .profile-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .profile-details {
      flex: 1;
      min-width: 0;
    }

    .profile-name {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #1a1a1a;
    }

    .profile-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .role-chip {
      font-size: 11px;
      height: 20px;
      border-radius: 10px;
    }

    .role-chip.advertiser {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .role-chip.promoter {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .verified-badge {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #4caf50;
    }

    .profile-stats {
      font-size: 12px;
      color: #666;
    }

    /* Navigation */
    .nav-list {
      padding: 16px 0;
    }

    .nav-list .mat-mdc-list-item {
      margin: 0 16px 4px;
      border-radius: 8px;
    }

    .active-nav-item {
      background-color: #f0f2ff;
      color: #667eea;
    }

    /* Quick Actions */
    .quick-actions {
      padding: 20px;
      border-top: 1px solid #e0e4e7;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: #666;
    }

    .action-btn {
      width: 100%;
      margin-bottom: 8px;
      justify-content: flex-start;
    }

    /* Sidenav Footer */
    .sidenav-footer {
      margin-top: auto;
      padding: 20px 0;
    }

    /* Desktop Header */
    .desktop-header {
      background: white;
      border-bottom: 1px solid #e0e4e7;
      color: #1a1a1a;
    }

    .page-title {
      font-size: 18px;
      font-weight: 600;
    }

    .header-spacer {
      flex: 1;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .wallet-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background-color: #f5f7fa;
      border-radius: 20px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .wallet-display:hover {
      background-color: #e8eaf6;
    }

    .wallet-amount {
      font-weight: 600;
      color: #667eea;
    }

    .avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
    }

    /* Main Content */
    .main-content {
      display: flex;
      flex-direction: column;
      overflow: auto;
    }

    .dashboard-content {
      flex: 1;
      padding: 24px;
      overflow: auto;
    }

    /* Overview Section */
    .overview-section {
      margin-bottom: 32px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }

    .stat-card {
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .stat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 12px;
    }

    .stat-trend.up {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .stat-trend.down {
      background-color: #ffebee;
      color: #d32f2f;
    }

    .stat-trend mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      color: #1a1a1a;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin: 4px 0 0 0;
    }

    /* Mobile Quick Actions */
    .mobile-quick-actions {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }

    /* Dashboard Tabs */
    .dashboard-tabs {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .tab-content {
      padding: 24px;
    }

    /* Campaigns Section */
    .campaigns-section {
      min-height: 400px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-header h3 {
      font-size: 20px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }

    .campaigns-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .campaign-card {
      border-radius: 16px;
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: pointer;
    }

    .campaign-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
    }

    .campaign-image {
      position: relative;
      height: 180px;
      overflow: hidden;
    }

    .campaign-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .campaign-status {
      position: absolute;
      top: 12px;
      right: 12px;
    }

    .campaign-reward {
      position: absolute;
      top: 12px;
      left: 12px;
    }

    .status-active {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-pending {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .status-completed {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-paused {
      background-color: #fafafa;
      color: #616161;
    }

    .campaign-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .campaign-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      color: #1a1a1a;
    }

    .campaign-description {
      font-size: 14px;
      color: #666;
      margin: 0 0 16px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .campaign-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 16px;
      padding: 12px 0;
      border-top: 1px solid #f0f0f0;
      border-bottom: 1px solid #f0f0f0;
    }

    .metric {
      text-align: center;
    }

    .metric-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .metric-value {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #1a1a1a;
    }

    .campaign-progress {
      margin-top: 16px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-label {
      font-size: 14px;
      font-weight: 500;
      color: #1a1a1a;
    }

    .progress-text {
      font-size: 12px;
      color: #666;
    }

    /* Campaign Info */
    .campaign-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #666;
    }

    .info-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    /* Available Campaigns */
    .available-campaigns-section {
      min-height: 400px;
    }

    .campaign-card.available {
      border: 2px solid transparent;
    }

    .campaign-card.available:hover {
      border-color: #667eea;
    }

    /* My Campaigns */
    .my-campaigns-section {
      min-height: 400px;
    }

    .campaigns-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .campaign-item {
      border-radius: 12px;
    }

    .campaign-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .campaign-info h4 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
      color: #1a1a1a;
    }

    .campaign-info p {
      font-size: 14px;
      color: #666;
      margin: 0;
    }

    .campaign-status {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
    }

    .earning-amount {
      font-size: 16px;
      font-weight: 600;
      color: #667eea;
    }

    .proof-status {
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }

    .proof-submitted {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #2e7d32;
    }

    /* Earnings Section */
    .earnings-section {
      min-height: 400px;
    }

    .earnings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .earnings-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .earning-stat {
      text-align: center;
      border-radius: 12px;
    }

    .earning-stat h3 {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #667eea;
    }

    .earning-stat p {
      font-size: 14px;
      color: #666;
      margin: 0;
    }

    /* Analytics & History Placeholders */
    .analytics-section,
    .history-section {
      min-height: 400px;
    }

    .analytics-placeholder,
    .history-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: #999;
    }

    .analytics-placeholder mat-icon,
    .history-placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    /* Notification Menu */
    .notification-menu {
      width: 320px;
      max-height: 400px;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
    }

    .notification-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .notification-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .notification-item {
      width: 100%;
      padding: 16px !important;
      height: auto !important;
      white-space: normal;
      border-bottom: 1px solid #f0f0f0;
    }

    .notification-item.unread {
      background-color: #f8f9ff;
      border-left: 3px solid #667eea;
    }

    .notification-content {
      text-align: left;
    }

    .notification-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: #1a1a1a;
    }

    .notification-message {
      font-size: 14px;
      color: #666;
      margin-bottom: 4px;
    }

    .notification-time {
      font-size: 12px;
      color: #999;
    }

    .no-notifications {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      color: #999;
    }

    .no-notifications mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .sidenav {
        width: 280px;
      }

      .dashboard-content {
        padding: 16px;
      }

      .stats-grid {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
      }

      .campaigns-grid {
        grid-template-columns: 1fr;
      }

      .earnings-summary {
        grid-template-columns: 1fr;
      }

      .campaign-metrics {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: left;
      }

      .section-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }

      .tab-content {
        padding: 16px;
      }
    }

    @media (max-width: 480px) {
      .dashboard-content {
        padding: 12px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .stat-value {
        font-size: 24px;
      }

      .campaign-card {
        margin-bottom: 16px;
      }

      .campaign-image {
        height: 160px;
      }

      .mobile-quick-actions {
        bottom: 16px;
        right: 16px;
      }

      .wallet-display {
        padding: 6px 12px;
      }

      .notification-menu {
        width: 280px;
      }
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .stat-card,
      .campaign-card,
      .dashboard-tabs {
        border: 2px solid #000;
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .stat-card,
      .campaign-card {
        transition: none;
      }
      
      .dashboard-tabs {
        animation-duration: 0ms !important;
      }
    }

    /* Focus styles for accessibility */
    .campaign-card:focus-within,
    .stat-card:focus-within {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;


  // Signals for reactive state management
  currentUser = signal<UserProfile>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'advertiser', // Change to 'promoter' to test promoter view
    verified: true,
    rating: 4.8,
    totalEarnings: 85000,
    totalSpent: 250000,
    activeCampaigns: 5,
    completedCampaigns: 23
  });

  walletBalance = signal(125000);

  campaigns = signal<Campaign[]>([
    {
      id: '1',
      title: 'Summer Fashion Collection',
      description: 'Promote our latest summer fashion collection with vibrant designs',
      budget: 50000,
      spent: 32000,
      reach: 15000,
      engagement: 2400,
      status: 'active',
      category: 'Fashion',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      targetAudience: 'Young Adults 18-35',
      createdAt: new Date(),
      promoters: 20,
      viewsRequired: 25000,
      currentViews: 15000
    },
    {
      id: '2',
      title: 'Tech Gadget Launch',
      description: 'Launch announcement for our revolutionary smart device',
      budget: 75000,
      spent: 45000,
      reach: 22000,
      engagement: 3800,
      status: 'active',
      category: 'Technology',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400',
      targetAudience: 'Tech Enthusiasts',
      createdAt: new Date(),
      promoters: 30,
      viewsRequired: 35000,
      currentViews: 22000
    }
  ]);

  earnings = signal<Earning[]>([
    {
      id: '1',
      campaignTitle: 'Summer Fashion Collection',
      amount: 2500,
      status: 'pending',
      date: new Date(),
      proofSubmitted: true,
      advertiser: 'Fashion Brand Co.'
    },
    {
      id: '2',
      campaignTitle: 'Restaurant Grand Opening',
      amount: 1500,
      status: 'approved',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      proofSubmitted: true,
      advertiser: 'Local Restaurant'
    }
  ]);

  notifications = signal<NotificationItem[]>([
    {
      id: '1',
      title: 'Campaign Approved',
      message: 'Your campaign "Summer Fashion" has been approved and is now live',
      type: 'success',
      timestamp: new Date(),
      read: false
    },
    {
      id: '2',
      title: 'Proof Required',
      message: 'Please upload proof for your campaign participation',
      type: 'warning',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false
    }
  ]);

  subscriptions: Subscription[] = [];

  // Computed signals
  isMobile = computed(() => {
    return this.breakpointObserver.isMatched('(max-width: 768px)');
  });

  unreadNotifications = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  dashboardStats = computed(() => {
    if (this.currentUser().role === 'advertiser') {
      return [
        {
          icon: 'campaign',
          label: 'Active Campaigns',
          value: this.currentUser().activeCampaigns?.toString() || '0',
          change: '+12',
          trend: 'up' as const,
          color: '#667eea'
        },
        {
          icon: 'visibility',
          label: 'Total Reach',
          value: '37K',
          change: '+25',
          trend: 'up' as const,
          color: '#4caf50'
        },
        {
          icon: 'account_balance_wallet',
          label: 'Total Spent',
          value: `₦${(this.currentUser().totalSpent || 0) / 1000}K`,
          change: '+8',
          trend: 'up' as const,
          color: '#ff9800'
        },
        {
          icon: 'thumb_up',
          label: 'Engagement',
          value: '6.2K',
          change: '+15',
          trend: 'up' as const,
          color: '#e91e63'
        }
      ];
    } else {
      return [
        {
          icon: 'monetization_on',
          label: 'Total Earnings',
          value: `₦${(this.currentUser().totalEarnings || 0) / 1000}K`,
          change: '+18',
          trend: 'up' as const,
          color: '#4caf50'
        },
        {
          icon: 'star',
          label: 'Rating',
          value: this.currentUser().rating?.toString() || '0',
          change: '+0.2',
          trend: 'up' as const,
          color: '#ff9800'
        },
        {
          icon: 'assignment_turned_in',
          label: 'Completed',
          value: this.currentUser().completedCampaigns?.toString() || '0',
          change: '+3',
          trend: 'up' as const,
          color: '#2196f3'
        },
        {
          icon: 'pending_actions',
          label: 'Pending',
          value: this.earnings().filter(e => e.status === 'pending').length.toString(),
          change: '-1',
          trend: 'down' as const,
          color: '#ff5722'
        }
      ];
    }
  });

  navigationItems = computed(() => {
    const baseItems = [
      { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
      { icon: 'notifications', label: 'Notifications', route: '/notifications', badge: this.unreadNotifications() }
    ];

    if (this.currentUser().role === 'advertiser') {
      return [
        ...baseItems,
        { icon: 'campaign', label: 'My Campaigns', route: '/campaigns' },
        { icon: 'analytics', label: 'Analytics', route: '/analytics' },
        { icon: 'account_balance_wallet', label: 'Wallet', route: '/wallet' },
        { icon: 'people', label: 'Promoters', route: '/promoters' },
        { icon: 'help', label: 'Support', route: '/support' }
      ];
    } else {
      return [
        ...baseItems,
        { icon: 'work', label: 'Available Campaigns', route: '/browse' },
        { icon: 'assignment', label: 'My Campaigns', route: '/my-campaigns' },
        { icon: 'monetization_on', label: 'Earnings', route: '/earnings' },
        { icon: 'help', label: 'Support', route: '/support' }
      ];
    }
  });

  pendingEarnings = computed(() => {
    return this.earnings()
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);
  });

  availableBalance = computed(() => {
    return this.earnings()
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);
  });

  ngOnInit(): void {
    // Subscribe to breakpoint changes
    this.subscriptions.push(
      this.breakpointObserver.observe([Breakpoints.HandsetPortrait]).subscribe(() => {
        // Trigger change detection if needed
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleSidenav(): void {
    // This will be handled by template reference
  }

  getPageTitle(): string {
    return this.currentUser().role === 'advertiser' ? 'Advertiser Dashboard' : 'Promoter Dashboard';
  }

  // Campaign Actions
  createCampaign(): void {
    this.snackBar.open('Create Campaign feature coming soon!', 'OK', { duration: 3000 });
  }

  viewCampaign(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId]);
  }

  viewProofs(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId, 'proofs']);
  }

  acceptCampaign(campaignId: string): void {
    this.snackBar.open('Campaign accepted! Check your active campaigns.', 'OK', { duration: 3000 });
  }

  viewCampaignDetails(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId, 'details']);
  }

  uploadProof(earningId: string): void {
    this.snackBar.open('Proof upload feature coming soon!', 'OK', { duration: 3000 });
  }

  // Wallet Actions
  fundWallet(): void {
    this.snackBar.open('Fund Wallet feature coming soon!', 'OK', { duration: 3000 });
  }

  openWallet(): void {
    this.router.navigate(['/wallet']);
  }

  withdraw(): void {
    this.snackBar.open('Withdrawal feature coming soon!', 'OK', { duration: 3000 });
  }

  // Notification Actions
  markAsRead(notificationId: string): void {
    this.notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }

  markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  // Profile Actions
  viewProfile(): void {
    this.router.navigate(['/profile']);
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }


  /**
  * Method to handle the sign-out process.
  * This is typically called from a button click event.
  */
  logout(): void {
    this.subscriptions.push(
      this.authService.signOut().subscribe({
        next: () => {
          // Handle successful sign-out
          //console.log('Sign-out successful. Navigating to login...');
          // Navigate the user to the login page or home page
          this.router.navigate(['/']); // Change '/login' to your desired route
        },
        error: (error: HttpErrorResponse) => {
          // Handle sign-out error
          console.error('Sign-out failed:', error.error.message);
          // Display an error message to the user, e.g., using a toast or snackbar
          this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 });
        }
      })
    )
  }
}