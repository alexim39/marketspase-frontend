import { Component, signal, computed, OnInit, inject, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CampaignService } from '../campaign/campaign.service';
import { CampaignInterface, UserInterface } from '../../../../shared-services/src/public-api';
import { UserService } from '../users/users.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EngagementStats, DashboardService, RevenueStats } from './dashboard.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-dashboard-main',
  providers: [CampaignService, UserService, DashboardService],
  imports: [CommonModule, RouterModule, MatIconModule, MatProgressBarModule],
  templateUrl: './dashboard-main.component.html',
  styleUrls: ['./dashboard-main.component.scss']
})
export class DashboardMainComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  readonly campaignService = inject(CampaignService);
  readonly userService = inject(UserService);
  isCampaignLoading = signal(true);
  isUserLoading = signal(true);

  readonly dashboardService = inject(DashboardService);

  totalCampaigns = signal(0);
  activeCampaigns = signal(0);
  pendingCampaigns = signal(0);
  completedCampaigns = signal(0);
  rejectedCampaigns = signal(0);
  categories = signal<string[]>([]);
  totalUsers = signal(0);
  activeUsers = signal(0);
  activeCampaignsChange = signal(0);
  usersChange = signal(0);

  totalRevenue = signal(0);
  revenueChange = signal(0);
  averageEngagement = signal(0);
  engagementChange = signal(0);

  isRevenueLoading = signal(true);
  isEngagementLoading = signal(true);
  
  ngOnInit(): void {
    this.loadCampaigns();
    this.loadUsers();
    this.loadRevenueStats();
    this.loadEngagementStats();
  }

  loadCampaigns(): void {
    this.isCampaignLoading.set(true);
    
    this.campaignService.getAppCampaigns()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (response) => {
        if (response.success) {
          //console.log('campaign ',response.data)
          this.calculateCampaignStats(response.data);
          this.isCampaignLoading.set(false);
        }
      },
      error: (error) => {
        this.isCampaignLoading.set(false);
      }
    })
  }

  loadUsers(): void {
    this.isUserLoading.set(true);

     this.userService.getAppUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            //console.log('users ',response.data)
            this.calculateUserStats(response.data)
            this.isUserLoading.set(false);
          }
        },
        error: (error) => {
          //console.error('Error fetching app users:', error);
          this.isUserLoading.set(false);
        }
      })
  }

  loadRevenueStats(): void {
    this.isRevenueLoading.set(true);
    
    this.dashboardService.getRevenueStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats: RevenueStats) => {
          this.totalRevenue.set(stats.totalRevenue);
          this.revenueChange.set(stats.revenueChange);
          this.isRevenueLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading revenue stats:', error);
          this.isRevenueLoading.set(false);
        }
      });
  }

  loadEngagementStats(): void {
    this.isEngagementLoading.set(true);
    
    this.dashboardService.getEngagementStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats: EngagementStats) => {
          this.averageEngagement.set(stats.averageEngagement);
          this.engagementChange.set(stats.engagementChange);
          this.isEngagementLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading engagement stats:', error);
          this.isEngagementLoading.set(false);
        }
      });
  }

  calculateCampaignStats(campaigns: CampaignInterface[]): void {
    this.totalCampaigns.set(campaigns.length);
    this.activeCampaigns.set(campaigns.filter(campaign => campaign.status === 'active').length);
    this.pendingCampaigns.set(campaigns.filter(campaign => campaign.status === 'pending').length);
    this.rejectedCampaigns.set(campaigns.filter(campaign => campaign.status === 'rejected').length);
    this.completedCampaigns.set(
      campaigns.filter(c => ['completed', 'exhausted', 'expired'].includes(c.status)).length
    );
  }

  calculateUserStats(users: UserInterface[]): void {
    this.totalUsers.set(users.length);
    this.activeUsers.set(users.filter(user => user.isActive === true).length);
  }
  
}