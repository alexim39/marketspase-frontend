// dashboard.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, TemplateRef, Signal, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardService } from '../dashboard.service';
import { WalletFundingComponent } from '../../wallet/funding/funding.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UserInterface } from '../../../../../shared-services/src/public-api';

// Interfaces
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
  providers: [DashboardService],
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
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  // Add ViewChild for sidenav
  @ViewChild('sidenav') sidenav!: MatSidenav;

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  activeTab: 'cart' | 'quick-actions' = 'cart';
  @ViewChild('cartDialogTemplate') cartDialogTemplate!: TemplateRef<any>;
  private cartDialogRef?: MatDialogRef<any>;

  activeCampaignsCount: number | undefined = 0;
  pendingCampaignsCount: number | undefined = 0;


  // Signals for reactive state management
  currentUser = signal<UserProfile>({
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    role: 'advertiser',
    verified: true,
    rating: 4.8,
    totalEarnings: 85000,
    totalSpent: 250000,
    activeCampaigns: 5,
    completedCampaigns: 23
  });

  //walletBalance = signal(125000);

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

  navigationItems = computed(() => {
    const baseItems = [
      { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
      { icon: 'notifications', label: 'Notifications', route: '/notifications', badge: this.unreadNotifications() }
    ];

    if (this.user()?.role === 'advertiser') {
      return [
        ...baseItems,
        { icon: 'campaign', label: 'Campaigns', route: './campaigns' },
        //{ icon: 'analytics', label: 'Analytics', route: '/analytics' },
        //{ icon: 'account_balance_wallet', label: 'Wallet', route: '/wallet' },
        //{ icon: 'people', label: 'Promoters', route: '/promoters' },
        { icon: 'help', label: 'Support', route: '/dashboard/settings/share' }
      ];
    } else {
      return [
        ...baseItems,
        { icon: 'work', label: 'Promotions', route: './campaigns' },
        //{ icon: 'assignment', label: 'My Campaigns', route: '/my-campaigns' },
        { icon: 'monetization_on', label: 'Earnings', route: '/earnings' },
        { icon: 'help', label: 'Support', route: '/dashboard/settings/share' }
      ];
    }
  });

  public ngOnInit(): void {
    // Subscribe to breakpoint changes
    // this.subscriptions.push(
    //   this.breakpointObserver.observe([Breakpoints.HandsetPortrait]).subscribe()
    // );

    
    this.calculateActiveCampaigns();
    this.calculatePendingCampaigns();
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  public toggleSidenav(): void {
    this.sidenav?.toggle();
  }

  public getPageTitle(): string {
    return this.user()!.role === 'advertiser' ? 'Advertiser Dashboard' : 'Promoter Dashboard';
  }

  // Campaign Actions
  public createCampaign(): void {
    //this.snackBar.open('Create Campaign feature coming soon!', 'OK', { duration: 3000 });
    this.router.navigate(['dashboard/campaigns/create']);
  }

  public viewPromotion(): void {
    //this.snackBar.open('Create Campaign feature coming soon!', 'OK', { duration: 3000 });
    this.router.navigate(['/dashboard/campaigns']);
  }

  public viewMyPromotion(): void {
    //this.snackBar.open('Create Campaign feature coming soon!', 'OK', { duration: 3000 });
    this.router.navigate(['/dashboard/campaigns/my-promotions']);
  }

  // Wallet Actions
  public fundWallet(): void {
    this.dialog.open(WalletFundingComponent, {
      // data: {
      //   currentBalance: 5000,
      //   campaignBudget: 15000
      // },
      panelClass: 'custom-dialog-container',
    });
  }

  public openWallet(): void {
    this.router.navigate(['/wallet']);
  }

  // Notification Actions
  public markAsRead(notificationId: string): void {
    this.notifications.update(notifications =>
      notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }

  public markAllAsRead(): void {
    this.notifications.update(notifications =>
      notifications.map(n => ({ ...n, read: true }))
    );
  }

  public viewAllNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  /**
  * Method to handle the sign-out process.
  */
  public logout(): void {
    this.subscriptions.push(
      this.authService.signOut().subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Sign-out failed:', error.error.message);
          this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 });
        }
      })
    )
  }

  public closeCartDialog(): void {
    this.cartDialogRef?.close();
  }

  public setActiveTab(tab: 'cart' | 'quick-actions'): void {
    this.activeTab = tab;
  }

  public openCartDialog(): void {
    this.cartDialogRef = this.dialog.open(this.cartDialogTemplate, {
      position: { 
        top: '72px',
        right: '24px'
      },
      hasBackdrop: true,
      backdropClass: 'cart-dialog-backdrop',
      panelClass: 'cart-dialog-panel',
      autoFocus: false
    });
  }

  public switchUser(role: string) {
    const roleObject = {
      role,
      userId: this.user()?._id
    }
    this.subscriptions.push(
      this.dashboardService.switchUser(roleObject).subscribe({
        next: (response) => {
          if (response.success) {
            window.location.reload()
          }
        },
        error: (error: HttpErrorResponse) => {
          let errorMessage = 'Server error occurred, please try again.';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }  
          this.snackBar.open(errorMessage, 'Ok',{duration: 3000});
        }
      })
    )
  }

  // get user active campaign
  calculateActiveCampaigns(): void {
    if (this.user()?.campaigns && Array.isArray(this.user()?.campaigns)) {
      this.activeCampaignsCount = this.user()?.campaigns?.filter(
        (campaign: any) => campaign.status === 'active'
      ).length;
    }
  }
  // get user pending campaign
  calculatePendingCampaigns(): void {
    if (this.user()?.campaigns && Array.isArray(this.user()?.campaigns)) {
      this.pendingCampaignsCount = this.user()?.campaigns?.filter(
        (campaign: any) => campaign.status === 'pending'
      ).length;
    }
  }










  // Add these methods to your dashboard.component.ts

/**
 * Get status icon based on campaign status
 */
getStatusIcon(status: string): string {
  const statusIcons: { [key: string]: string } = {
    'active': 'play_circle_filled',
    'paused': 'pause_circle_filled',
    'completed': 'check_circle',
    'pending': 'pending',
    'exhausted': 'cancel',
    'expired': 'expired',
    'ended': 'expired'
  };
  return statusIcons[status] || 'help_outline';
}

/**
 * Calculate campaign progress percentage
 */
getProgressPercentage(campaign: any): number {
  if (!campaign.startDate || !campaign.endDate) {
    return 0;
  }

  const now = new Date();
  const start = new Date(campaign.startDate);
  const end = new Date(campaign.endDate);

  if (now < start) return 0;
  if (now > end) return 100;

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();

  return Math.round((elapsed / totalDuration) * 100);
}

/**
 * View campaign details
 */
viewCampaignDetails(campaignId: string): void {
  this.router.navigate(['/campaigns', campaignId]);
}

/**
 * View campaign analytics
 */
viewAnalytics(campaignId: string): void {
  this.router.navigate(['/campaigns', campaignId, 'analytics']);
}

/**
 * Manage campaign settings
 */
manageCampaign(campaignId: string): void {
  this.router.navigate(['/campaigns', campaignId, 'manage']);
}

/**
 * Duplicate campaign
 */
duplicateCampaign(campaignId: string): void {
  // // Show confirmation dialog
  // const dialogRef = this.dialog.open(ConfirmDialogComponent, {
  //   data: {
  //     title: 'Duplicate Campaign',
  //     message: 'Are you sure you want to create a copy of this campaign?',
  //     confirmText: 'Duplicate',
  //     cancelText: 'Cancel'
  //   }
  // });

  // dialogRef.afterClosed().subscribe(result => {
  //   if (result) {
  //     // Call API to duplicate campaign
  //     this.campaignService.duplicateCampaign(campaignId).subscribe({
  //       next: (duplicatedCampaign) => {
  //         this.snackBar.open('Campaign duplicated successfully', 'Close', {
  //           duration: 3000,
  //           panelClass: ['success-snackbar']
  //         });
  //         // Refresh campaign list or navigate to new campaign
  //         this.loadCampaigns();
  //       },
  //       error: (error) => {
  //         this.snackBar.open('Failed to duplicate campaign', 'Close', {
  //           duration: 3000,
  //           panelClass: ['error-snackbar']
  //         });
  //       }
  //     });
  //   }
  // });
}

/**
 * Export campaign data
 */
exportCampaignData(campaignId: string): void {
  // this.campaignService.exportCampaignData(campaignId).subscribe({
  //   next: (data) => {
  //     // Create and download CSV file
  //     const blob = new Blob([data], { type: 'text/csv' });
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = `campaign-${campaignId}-data.csv`;
  //     link.click();
  //     window.URL.revokeObjectURL(url);

  //     this.snackBar.open('Campaign data exported successfully', 'Close', {
  //       duration: 3000,
  //       panelClass: ['success-snackbar']
  //     });
  //   },
  //   error: (error) => {
  //     this.snackBar.open('Failed to export campaign data', 'Close', {
  //       duration: 3000,
  //       panelClass: ['error-snackbar']
  //     });
  //   }
  // });
}

/**
 * Share campaign report
 */
shareReport(campaignId: string): void {
  // // Open share dialog
  // const dialogRef = this.dialog.open(ShareReportDialogComponent, {
  //   data: { campaignId },
  //   width: '400px'
  // });

  // dialogRef.afterClosed().subscribe(result => {
  //   if (result) {
  //     this.snackBar.open('Report shared successfully', 'Close', {
  //       duration: 3000,
  //       panelClass: ['success-snackbar']
  //     });
  //   }
  // });
}

/**
 * Pause campaign
 */
pauseCampaign(campaignId: string): void {
  // const dialogRef = this.dialog.open(ConfirmDialogComponent, {
  //   data: {
  //     title: 'Pause Campaign',
  //     message: 'Are you sure you want to pause this campaign? It will stop showing to promoters.',
  //     confirmText: 'Pause',
  //     cancelText: 'Cancel',
  //     confirmColor: 'warn'
  //   }
  // });

  // dialogRef.afterClosed().subscribe(result => {
  //   if (result) {
  //     this.campaignService.pauseCampaign(campaignId).subscribe({
  //       next: () => {
  //         this.snackBar.open('Campaign paused successfully', 'Close', {
  //           duration: 3000,
  //           panelClass: ['success-snackbar']
  //         });
  //         // Update campaign status in the UI
  //         this.updateCampaignStatus(campaignId, 'paused');
  //       },
  //       error: (error) => {
  //         this.snackBar.open('Failed to pause campaign', 'Close', {
  //           duration: 3000,
  //           panelClass: ['error-snackbar']
  //         });
  //       }
  //     });
  //   }
  // });
}

/**
 * Update campaign status in the UI
 */
private updateCampaignStatus(campaignId: string, status: string): void {
  // const campaign = this.user()?.campaigns?.find(c => c._id === campaignId);
  // if (campaign) {
  //   campaign.status = status;
  // }
}

/**
 * Load campaigns from API
 */
private loadCampaigns(): void {
  // this.campaignService.getUserCampaigns().subscribe({
  //   next: (campaigns) => {
  //     // Update user campaigns
  //     if (this.user()) {
  //       this.user.update(user => ({
  //         ...user!,
  //         campaigns: campaigns
  //       }));
  //     }
  //   },
  //   error: (error) => {
  //     console.error('Failed to load campaigns:', error);
  //   }
  // });
}
}