import { Component, signal, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EngagementStats, DashboardService, RevenueStats, CampaignStats, UserStats } from './dashboard.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-dashboard-main',
  standalone: true,
  providers: [DashboardService],
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressBarModule],
  templateUrl: './dashboard-main.component.html',
  styleUrls: ['./dashboard-main.component.scss']
})
export class DashboardMainComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardService = inject(DashboardService);

  // Loading states
  readonly isLoading = signal({
    campaigns: false,
    users: false,
    revenue: false,
    engagement: false
  });

  // Campaign stats
  readonly campaignStats = signal({
    totalCampaigns: 0,
    activeCampaigns: 0,
    activeCampaignsChange: 0
  });

  // User stats
  readonly userStats = signal({
    totalUsers: 0,
    activeUsers: 0,
    usersChange: 0
  });

  // Revenue stats
  readonly revenueStats = signal({
    totalRevenue: 0,
    revenueChange: 0
  });

  // Engagement stats
  readonly engagementStats = signal({
    averageEngagement: 0,
    engagementChange: 0
  });

  ngOnInit(): void {
    this.loadAllStats();
  }

  private loadAllStats(): void {
    // Load all stats in parallel for better performance
    this.loadCampaignStats();
    this.loadUserStats();
    this.loadRevenueStats();
    this.loadEngagementStats();
  }

  private loadCampaignStats(): void {
    this.isLoading.update(state => ({ ...state, campaigns: true }));

    this.dashboardService.getCampaignStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading.update(state => ({ ...state, campaigns: false }));
        })
      )
      .subscribe({
        next: (stats: CampaignStats) => {
          this.campaignStats.set({
            totalCampaigns: stats.totalCampaigns,
            activeCampaigns: stats.activeCampaigns,
            activeCampaignsChange: stats.activeCampaignsChange
          });
        },
        error: (error) => {
          console.error('Error loading campaign stats:', error);
          // Set default values on error
          this.campaignStats.set({
            totalCampaigns: 0,
            activeCampaigns: 0,
            activeCampaignsChange: 0
          });
        }
      });
  }

  private loadUserStats(): void {
    this.isLoading.update(state => ({ ...state, users: true }));

    this.dashboardService.getUserStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading.update(state => ({ ...state, users: false }));
        })
      )
      .subscribe({
        next: (stats: UserStats) => {
          this.userStats.set({
            totalUsers: stats.totalUsers,
            activeUsers: stats.activeUsers,
            usersChange: stats.usersChange
          });
        },
        error: (error) => {
          console.error('Error loading user stats:', error);
          this.userStats.set({
            totalUsers: 0,
            activeUsers: 0,
            usersChange: 0
          });
        }
      });
  }

  private loadRevenueStats(): void {
    this.isLoading.update(state => ({ ...state, revenue: true }));

    this.dashboardService.getRevenueStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading.update(state => ({ ...state, revenue: false }));
        })
      )
      .subscribe({
        next: (stats: RevenueStats) => {
          this.revenueStats.set({
            totalRevenue: stats.totalRevenue,
            revenueChange: stats.revenueChange
          });
        },
        error: (error) => {
          console.error('Error loading revenue stats:', error);
          this.revenueStats.set({
            totalRevenue: 0,
            revenueChange: 0
          });
        }
      });
  }

  private loadEngagementStats(): void {
    this.isLoading.update(state => ({ ...state, engagement: true }));

    this.dashboardService.getEngagementStats()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading.update(state => ({ ...state, engagement: false }));
        })
      )
      .subscribe({
        next: (stats: EngagementStats) => {
          this.engagementStats.set({
            averageEngagement: stats.averageEngagement,
            engagementChange: stats.engagementChange
          });
        },
        error: (error) => {
          console.error('Error loading engagement stats:', error);
          this.engagementStats.set({
            averageEngagement: 0,
            engagementChange: 0
          });
        }
      });
  }

  // Helper getters for template
  isCampaignLoading = () => this.isLoading().campaigns;
  isUserLoading = () => this.isLoading().users;
  isRevenueLoading = () => this.isLoading().revenue;
  isEngagementLoading = () => this.isLoading().engagement;

  // Refresh function
  refreshStats(): void {
    // Clear cache and reload
    this.dashboardService.clearCache();
    this.loadAllStats();
  }
}