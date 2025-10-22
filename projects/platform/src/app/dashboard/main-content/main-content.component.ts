import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../common/services/user.service';
import { DashboardService } from './../dashboard.service';
import { TestimonialsComponent } from '../testimonial/testimonial.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProfileNotifierBannerComponent } from './notification-banner/profiile-notifier/profile-notifier-banner.component';
import { MatMenuModule } from '@angular/material/menu';
import { DeviceService } from '../../../../../shared-services/src/public-api';
import { PromoBannerComponent } from './notification-banner/promo/promo-banner.component';

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
  selector: 'main-container',
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
    PromoBannerComponent
  ],
  templateUrl: './main-content.component.html',
  styleUrls: ['./main-content.component.scss'],
})
export class DashboardMainContainer {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly deviceService = inject(DeviceService);

  public user = this.userService.user;

   isMobile = computed(() => {
    return this.deviceService.deviceState().isMobile;
  });

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

    // Calculate earnings from paid promotions
    const totalEarnings = promotions
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + (p.payoutAmount ?? 0), 0);
    
    // Calculate pending earnings (validated but not paid)
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
          label: 'Campaign Budget',
          value: `₦${(summary.totalBudget / 1000).toFixed(0)}K`,
          change: '+8',
          trend: 'up',
          color: '#ff9800',
          subtitle: `₦${(summary.spentBudget / 1000).toFixed(0)}K spent`
        },
        {
          icon: 'savings',
          label: 'Available Balance',
          value: `₦${((wallet?.balance || 0) / 1000).toFixed(0)}K`,
          color: '#4caf50',
          subtitle: `₦${((wallet?.reserved || 0) / 1000).toFixed(0)}K reserved`
        },
        // {
        //   icon: 'trending_up',
        //   label: 'Total Reach',
        //   value: '37K',
        //   change: '+25',
        //   trend: 'up',
        //   color: '#e91e63',
        //   subtitle: 'Last 30 days'
        // }
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
          label: 'Completed Promotions',
          value: summary.paid.toString(),
          change: '+3',
          trend: 'up',
          color: '#2196f3',
          subtitle: `${summary.total} total promotions`
        },
        {
          icon: 'pending_actions',
          label: 'Pending Review',
          value: summary.submitted.toString(),
          change: '+1',
          trend: 'up',
          color: '#ff9800',
          subtitle: `${summary.validated} validated`
        },
        {
          icon: 'star',
          label: 'Rating',
          value: userData.rating?.toString() || '0',
          change: '+0.2',
          trend: 'up',
          color: '#ff5722',
          subtitle: `${ 0 } reviews`
          //subtitle: `${userData.ratingCount || 0} reviews`
        }
      ];
    }
  });

  recentActivity = computed(() => {
    const userData = this.user();
    if (!userData) return [];
    
    // Combine transactions from both wallets if available
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
    
    // Sort by date, newest first and take the 5 most recent
    return transactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  });

  createCampaign(): void {
    this.router.navigate(['dashboard/campaigns/create']);
  }

  browseCampaign(): void {
    this.router.navigate(['dashboard/campaigns']);
  }

  viewCampaigns(): void {
    this.router.navigate(['dashboard/campaigns']);
  }

  viewPromotions(): void {
    this.router.navigate(['dashboard/campaigns']);
  }

  withdrawWallet(): void {
    this.router.navigate(['dashboard/transactions/withdrawal']);
  }

  viewWallet(): void {
    this.router.navigate(['dashboard/transactions']);
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
    const roleObject = {
      role,
      userId: this.user()?._id
    };
    
    this.dashboardService.switchUser(roleObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            window.location.reload();
          }
        },
        error: (error: HttpErrorResponse) => {
          const errorMessage = error.error?.message || 'Server error occurred, please try again.';
          this.snackBar.open(errorMessage, 'Ok', { duration: 3000 });
        }
      });
  }
}