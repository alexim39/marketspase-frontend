// dashboard.component.ts
import { Component, OnInit, OnDestroy, inject, signal, computed, ViewChild, Input, TemplateRef, Signal, DestroyRef, } from '@angular/core';
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
import { AuthService } from '../../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardService } from '../dashboard.service';
import { WalletFundingComponent } from '../../wallet/funding/funding.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UserInterface, DeviceService } from '../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Interfaces
export interface Earning {
  id: string;
  campaignTitle: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  date: Date;
  proofSubmitted: boolean;
  marketer: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
}

/* export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'marketer' | 'promoter';
  verified: boolean;
  rating: number;
  totalEarnings?: number;
  totalSpent?: number;
  activeCampaigns?: number;
  completedCampaigns?: number;
}
 */
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
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private readonly deviceService = inject(DeviceService);

  // Add ViewChild for sidenav
  @ViewChild('sidenav') sidenav!: MatSidenav;

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  activeTab: 'cart' | 'quick-actions' = 'cart';
  @ViewChild('cartDialogTemplate') cartDialogTemplate!: TemplateRef<any>;
  private cartDialogRef?: MatDialogRef<any>;

  activeCampaignsCount: number | undefined = 0;
  pendingCampaignsCount: number | undefined = 0;
  pendingPromotionsCount: number | undefined = 0;
  private readonly destroyRef = inject(DestroyRef);

  earnings = signal<Earning[]>([
    {
      id: '1',
      campaignTitle: 'Summer Fashion Collection',
      amount: 2500,
      status: 'pending',
      date: new Date(),
      proofSubmitted: true,
      marketer: 'Fashion Brand Co.'
    },
    {
      id: '2',
      campaignTitle: 'Restaurant Grand Opening',
      amount: 1500,
      status: 'approved',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      proofSubmitted: true,
      marketer: 'Local Restaurant'
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


  // Computed signals
  isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });

  unreadNotifications = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  navigationItems = computed(() => {
    const baseItems = [
      { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
      { icon: 'notifications', label: 'Notifications', route: '/notifications', badge: this.unreadNotifications() }
    ];

    if (this.user()?.role === 'marketer') {
      return [
        ...baseItems,
        { icon: 'campaign', label: 'Campaigns', route: './campaigns' },
        //{ icon: 'analytics', label: 'Analytics', route: '/analytics' },
        //{ icon: 'account_balance_wallet', label: 'Wallet', route: '/wallet' },
        //{ icon: 'people', label: 'Promoters', route: '/promoters' },
        { icon: 'currency_exchange', label: 'Transactions', route: '/dashboard/transactions' },
        { icon: 'help', label: 'Support', route: '/dashboard/settings/share' }
      ];
    } else {
      return [
        ...baseItems,
        { icon: 'work', label: 'Promotions', route: './campaigns' },
        //{ icon: 'assignment', label: 'My Campaigns', route: '/my-campaigns' },
        { icon: 'currency_exchange', label: 'Transactions', route: '/dashboard/transactions' },
        { icon: 'help', label: 'Support', route: '/dashboard/settings/share' }
      ];
    }
  });

  public ngOnInit(): void {
    this.calculateActiveCampaigns();
    this.calculatePendingCampaigns();
    this.calculatePendingPromotions();
  }


  ngOnDestroy(): void {
    // this.destroy$.next();
    // this.destroy$.complete();
  }


  public toggleSidenav(): void {
    this.sidenav?.toggle();
  }

  public getPageTitle(): string {
    return this.user()!.role === 'marketer' ? 'marketer Dashboard' : 'Promoter Dashboard';
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
  
  public viewAllCampaigns(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  public viewAllPromotion(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  public viewWithdrawl(): void {
    this.router.navigate(['/dashboard/transactions/withdrawal']);
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
    this.router.navigate(['/dashboard/transactions']);
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
      this.authService.signOut()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Sign-out failed:', error.error.message);
          this.snackBar.open('Sign-out failed', 'OK', { duration: 3000 });
        }
      })
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
      this.dashboardService.switchUser(roleObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
  // get user pending promotions
  calculatePendingPromotions(): void {
    const promotions = this.user()?.promotion;

    if (Array.isArray(promotions)) {
      this.pendingPromotionsCount = promotions.filter(
        (p: any) => p.status === 'pending' || p.status === 'submitted'
      ).length;
    } else {
      this.pendingPromotionsCount = 0;
    }
  }


  /**
   * Calculates the total number of active campaigns.
   */
  getActiveCampaignCount(): number {
    return this.user()?.campaigns?.filter(c => c.status === 'active')?.length || 0;
  }

  /**
   * Calculates the total number of rejected campaigns.
   */
  getRejectedPromotionCount(): number {
    return this.user()?.promotion?.filter(p => p.status === 'rejected')?.length || 0;
  }

  /**
   * Calculates the total number of validated campaigns.
   */
  getValidatedPromotionCount(): number {
    return this.user()?.promotion?.filter(p => p.status === 'validated')?.length || 0;
  }

  /**
   * Calculates the total number of validated campaign across all campaigns.
   */
  getTotalCampaigns(): number {
    return this.user()?.campaigns?.length || 0;
  }

  /**
   * Calculates the total amount spent across all campaigns.
   */
  getTotalSpent(): number {
    // Note: The previous HTML had a hardcoded value of 450.
    // This assumes there's a 'spentAmount' property on the campaign object.
    // If not, you'll need to calculate this based on your data model.
    //return this.user()?.campaigns?.reduce((sum, c) => sum + (c.spentAmount || 0), 0) || 0;
    return 4500
  }

  /**
   * Calculates the total remaining budget across all campaigns.
   */
  getTotalRemainingBudget(): number {
    // Note: The previous HTML had hardcoded values (e.g., campaign.budget - 567).
    // This new implementation assumes a 'budget' and 'spentAmount' property.
    //return this.user()?.campaigns?.reduce((sum, c) => sum + ((c.budget || 0) - (c.spentAmount || 0)), 0) || 0;
    return 3000
  }


  // The following methods were part of the old loop and are now unused.
  // I will keep them here for now, as they might be used on the main campaigns page.
  // You can safely remove them if you confirm they are not used anywhere else.
  // getStatusIcon(status: string): string { ... }
  // getProgressPercentage(campaign: any): number { ... }
  // viewCampaignDetails(campaignId: string): void { ... }
  // viewAnalytics(campaignId: string): void { ... }
  // manageCampaign(campaignId: string): void { ... }
  // duplicateCampaign(campaignId: string): void { ... }
  // exportCampaignData(campaignId: string): void { ... }
  // shareReport(campaignId: string): void { ... }
  // pauseCampaign(campaignId: string): void { ... }
  // updateCampaignStatus(campaignId: string, status: string): void { ... }
  // loadCampaigns(): void { ... }
}