// main-content-mobile.component.ts (Enhanced)
import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../auth/auth.service';
import { UserService } from '../../../common/services/user.service';
import { DashboardService } from './../../dashboard.service';
import { TestimonialsComponent } from '../../testimonial/testimonial.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileNotifierBannerComponent } from '../notification-banner/profiile-notifier/profile-notifier-banner.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { DeviceService } from '../../../../../../shared-services/src/public-api';
import { QuickActionsSheetComponent } from './quick-actions-sheet.component';

interface DashboardStat {
  icon: string;
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  color: string;
  subtitle?: string;
}

interface CampaignSummary {
  active: number;
  completed: number;
  totalBudget: number;
  spentBudget: number;
  totalPromoters: number;
}

interface PromotionSummary {
  total: number;
  pending: number;
  submitted: number;
  validated: number;
  paid: number;
  totalEarnings: number;
  pendingEarnings: number;
  availableEarnings: number;
}

@Component({
  selector: 'app-main-container-mobile',
  providers: [DashboardService],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    TestimonialsComponent,
    ProfileNotifierBannerComponent,
    MatMenuModule,
    MatBottomSheetModule
  ],
  templateUrl: './main-content-mobile.component.html',
  styleUrls: ['./main-content-mobile.component.scss'],
})
export class DashboardMainMobileContainer {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deviceService = inject(DeviceService);
  private bottomSheet = inject(MatBottomSheet);

  public user = this.userService.user;

  isSwitchingRole = signal(false);

  isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });

  // Enhanced tab system with testimonial tab
  currentTabIndex = signal(0);
  tabs = signal(['Overview', 'Activity', 'Wallet', 'Testimonials']);

  // Pull to refresh state
  isRefreshing = signal(false);
  pullToRefreshThreshold = 60;

  campaignSummary = computed((): CampaignSummary => {
    const userData = this.user();
    if (!userData?.campaigns) {
      return { active: 0, completed: 0, totalBudget: 0, spentBudget: 0, totalPromoters: 0 };
    }

    const activeCampaigns = userData.campaigns.filter(c => c.status === 'active');
    const completedCampaigns = userData.campaigns.filter(c => c.status === 'completed');
    
    const totalBudget = userData.campaigns.reduce((sum, c) => sum + c.budget, 0);
    const spentBudget = userData.campaigns.reduce((sum, c) => sum + c.spentBudget, 0);
    const totalPromoters = userData.campaigns.reduce((sum, c) => sum + c.currentPromoters, 0);

    return {
      active: activeCampaigns.length,
      completed: completedCampaigns.length,
      totalBudget,
      spentBudget,
      totalPromoters
    };
  });

  promotionSummary = computed((): PromotionSummary => {
    const userData = this.user();
    if (!userData?.promotion) {
      return { 
        total: 0, 
        pending: 0, 
        submitted: 0, 
        validated: 0, 
        paid: 0, 
        totalEarnings: 0, 
        pendingEarnings: 0, 
        availableEarnings: 0 
      };
    }

    const promotions = userData.promotion;
    const wallet = userData.wallets?.promoter;
    
    const pending = promotions.filter(p => p.status === 'pending').length;
    const submitted = promotions.filter(p => p.status === 'submitted').length;
    const validated = promotions.filter(p => p.status === 'validated').length;
    const paid = promotions.filter(p => p.status === 'paid').length;

    const totalEarnings = promotions
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.payoutAmount ?? 0), 0);
    
    const pendingEarnings = promotions
      .filter(p => p.status === 'validated')
      .reduce((sum, p) => sum + (p.payoutAmount ?? 0), 0);

    return {
      total: promotions.length,
      pending,
      submitted,
      validated,
      paid,
      totalEarnings,
      pendingEarnings,
      availableEarnings: wallet?.balance || 0
    };
  });

  dashboardStats = computed((): DashboardStat[] => {
    const userData = this.user();
    if (!userData) return [];

    if (userData.role === 'marketer') {
      const summary = this.campaignSummary();
      const wallet = userData.wallets?.marketer;
      
      return [
        {
          icon: 'campaign',
          label: 'Active Campaigns',
          value: summary.active.toString(),
          change: '+2',
          trend: 'up',
          color: '#667eea',
          subtitle: `${summary.totalPromoters} promoters`
        },
        {
          icon: 'account_balance_wallet',
          label: 'Available Balance',
          value: `₦${((wallet?.balance || 0) / 1000).toFixed(0)}K`,
          color: '#4caf50',
          subtitle: `₦${((wallet?.reserved || 0) / 1000).toFixed(0)}K reserved`
        },
        {
          icon: 'trending_up',
          label: 'Total Reach',
          value: '37K',
          change: '+25',
          trend: 'up',
          color: '#e91e63',
          subtitle: 'Last 30 days'
        }
      ];
    } else {
      const summary = this.promotionSummary();
      const wallet = userData.wallets?.promoter;
      
      return [
        {
          icon: 'monetization_on',
          label: 'Available Earnings',
          value: `₦${summary.availableEarnings}`,
          color: '#4caf50',
          subtitle: `₦${summary.pendingEarnings} pending`
        },
        {
          icon: 'assignment_turned_in',
          label: 'Completed',
          value: summary.paid.toString(),
          change: '+3',
          trend: 'up',
          color: '#2196f3',
          subtitle: `${summary.total} total`
        },
        {
          icon: 'pending_actions',
          label: 'Pending Review',
          value: summary.submitted.toString(),
          change: '+1',
          trend: 'up',
          color: '#ff9800',
          subtitle: `${summary.validated} validated`
        }
      ];
    }
  });

  recentActivity = computed(() => {
    const userData = this.user();
    if (!userData) return [];
    
    const transactions = [];
    
    if (userData.wallets?.marketer?.transactions) {
      transactions.push(...userData.wallets.marketer.transactions.map(t => ({
        ...t,
        walletType: 'marketer'
      })));
    }
    
    if (userData.wallets?.promoter?.transactions) {
      transactions.push(...userData.wallets.promoter.transactions.map(t => ({
        ...t,
        walletType: 'promoter'
      })));
    }
    
    return transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  });

  // Mobile-optimized navigation
  selectTab(index: number): void {
    this.currentTabIndex.set(index);
  }



  // Enhanced quick actions with proper bottom sheet
 quickActions(): void {
  this.bottomSheet.open(QuickActionsSheetComponent, {
    data: {
      user: this.user(),
      onActionSelected: (action: string, data?: any) => this.handleQuickAction(action, data)
    }
  });
}

private handleQuickAction(action: string, data?: any): void {
  switch (action) {
    case 'createCampaign':
      this.createCampaign();
      break;
    case 'browseCampaign':
      this.browseCampaign();
      break;
    case 'viewCampaigns':
      this.viewCampaigns();
      break;
    case 'viewPromotions':
      this.viewPromotions();
      break;
    case 'withdraw':
      this.withdrawWallet();
      break;
    case 'transactions':
      this.viewWallet();
      break;
    case 'profile':
      this.router.navigate(['dashboard/profile']);
      break;
    case 'settings':
      this.router.navigate(['dashboard/settings']);
      break;
    case 'help':
      this.router.navigate(['dashboard/help']);
      break;
    case 'switchRole':
      this.switchUser(data); // data contains the role to switch to
      break;
    case 'logout':
      this.logout();
      break;
  }
}



    // Enhanced swipe with pull-to-refresh
  onSwipe(event: any): void {
    // Horizontal swipe for tab navigation
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      const direction = event.deltaX > 0 ? 'right' : 'left';
      const currentIndex = this.currentTabIndex();
      
      if (direction === 'left' && currentIndex < this.tabs().length - 1) {
        this.currentTabIndex.set(currentIndex + 1);
      } else if (direction === 'right' && currentIndex > 0) {
        this.currentTabIndex.set(currentIndex - 1);
      }
    }
    // Vertical swipe for pull-to-refresh (only on overview tab)
    else if (this.currentTabIndex() === 0 && event.deltaY > this.pullToRefreshThreshold) {
      this.refreshData();
    }
  }

  // Pull to refresh functionality
  refreshData(): void {
    this.isRefreshing.set(true);
    
    // Simulate API call
    // setTimeout(() => {
    //   // In a real app, you would call your data refresh service here
    //   this.userService.refreshUserData().pipe(
    //     takeUntilDestroyed(this.destroyRef)
    //   ).subscribe({
    //     next: () => {
    //       this.snackBar.open('Data refreshed', 'OK', { duration: 2000 });
    //       this.isRefreshing.set(false);
    //     },
    //     error: () => {
    //       this.snackBar.open('Refresh failed', 'OK', { duration: 2000 });
    //       this.isRefreshing.set(false);
    //     }
    //   });
    // }, 1000);
  }

  // Quick action methods
  navigateToProfile(): void {
    this.router.navigate(['dashboard/profile']);
  }

  navigateToSettings(): void {
    this.router.navigate(['dashboard/settings']);
  }

  navigateToHelp(): void {
    this.router.navigate(['dashboard/help']);
  }

  // Enhanced navigation with analytics tracking
  createCampaign(): void {
    this.trackAction('create_campaign_mobile');
    this.router.navigate(['dashboard/campaigns/create']);
  }

  browseCampaign(): void {
    this.trackAction('browse_campaigns_mobile');
    this.router.navigate(['dashboard/campaigns']);
  }

  viewCampaigns(): void {
    this.trackAction('view_my_campaigns_mobile');
    this.router.navigate(['dashboard/campaigns']);
  }

  viewPromotions(): void {
    this.trackAction('view_my_promotions_mobile');
    this.router.navigate(['dashboard/campaigns']);
  }

  withdrawWallet(): void {
    this.trackAction('withdraw_wallet_mobile');
    this.router.navigate(['dashboard/transactions/withdrawal']);
  }

  viewWallet(): void {
    this.trackAction('view_wallet_mobile');
    this.router.navigate(['dashboard/transactions']);
  }

  private trackAction(action: string): void {
    // In a real app, you would call your analytics service here
    console.log(`Tracking action: ${action}`);
  }






  formatCurrency(amount: number): string {
    return `₦${amount.toLocaleString()}`;
  }

  logout(): void {
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
      });
  }

switchUser(role: string): void {
  if (this.isSwitchingRole() || role === this.user()?.role) {
    return;
  }

  this.isSwitchingRole.set(true);
  
  const roleObject = {
    role,
    userId: this.user()?._id
  };
  
  this.dashboardService.switchUser(roleObject)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open(`Switched to ${role} mode`, 'OK', { duration: 2000 });
          // Small delay to show feedback before reload
          setTimeout(() => {
            window.location.reload();
          }, 500);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isSwitchingRole.set(false);
        const errorMessage = error.error?.message || 'Failed to switch role, please try again.';
        this.snackBar.open(errorMessage, 'OK', { duration: 3000 });
      }
    });
}
}