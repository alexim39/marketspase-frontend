import { Component, signal, computed, OnInit, inject, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CampaignService } from '../campaign/campaign.service';
import { CampaignInterface, UserInterface } from '../../../../shared-services/src/public-api';
import { UserService } from '../users/users.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EngagementStats, RevenueService, RevenueStats } from './revenue.service';

interface PromotionPost {
  id: string;
  title: string;
  marketer: string;
  budget: number;
  rate: number;
  totalSlots: number;
  filledSlots: number;
  status: 'active' | 'completed' | 'pending' | 'paused';
  createdDate: string;
  category: string;
  engagement: number;
}

interface StatusPromotion {
  id: string;
  postTitle: string;
  promoter: string;
  promoterPhone: string;
  views: number;
  requiredViews: number;
  postedTime: string;
  expiresIn: string;
  status: 'active' | 'expired' | 'verified' | 'failed';
  payment: number;
}

@Component({
  selector: 'app-dashboard-main',
  providers: [CampaignService, UserService, RevenueService],
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './dashboard-main.component.html',
  styleUrls: ['./dashboard-main.component.scss']
})
export class DashboardMainComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  readonly campaignService = inject(CampaignService);
  readonly userService = inject(UserService);
  isCampaignLoading = signal(true);
  isUserLoading = signal(true);


  readonly revenueService = inject(RevenueService);

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
  
  // Data
  promotionPosts: PromotionPost[] = [
    {
      id: 'POST-001',
      title: 'Nike Air Max Summer Collection Launch',
      marketer: 'Nike Nigeria',
      budget: 150000,
      rate: 500,
      totalSlots: 300,
      filledSlots: 245,
      status: 'active',
      createdDate: '2025-08-28',
      category: 'Fashion',
      engagement: 85.2
    },
    {
      id: 'POST-002',
      title: 'Tecno Phantom X2 Pro Giveaway',
      marketer: 'Tecno Mobile',
      budget: 200000,
      rate: 400,
      totalSlots: 500,
      filledSlots: 320,
      status: 'active',
      createdDate: '2025-08-27',
      category: 'Technology',
      engagement: 92.1
    },
    {
      id: 'POST-003',
      title: 'Dominos Pizza Weekend Special',
      marketer: 'Dominos Pizza',
      budget: 75000,
      rate: 300,
      totalSlots: 250,
      filledSlots: 250,
      status: 'completed',
      createdDate: '2025-08-25',
      category: 'Food',
      engagement: 76.8
    },
    {
      id: 'POST-004',
      title: 'Jumia Black Friday Preview',
      marketer: 'Jumia Nigeria',
      budget: 300000,
      rate: 600,
      totalSlots: 500,
      filledSlots: 0,
      status: 'pending',
      createdDate: '2025-08-30',
      category: 'E-commerce',
      engagement: 0
    },
    {
      id: 'POST-005',
      title: 'Spotify Premium 3-Month Free',
      marketer: 'Spotify',
      budget: 120000,
      rate: 450,
      totalSlots: 267,
      filledSlots: 156,
      status: 'paused',
      createdDate: '2025-08-26',
      category: 'Entertainment',
      engagement: 68.4
    }
  ];
  
  statusPromotions: StatusPromotion[] = [
    {
      id: 'STATUS-001',
      postTitle: 'Nike Air Max Summer Collection',
      promoter: 'Sarah Johnson',
      promoterPhone: '+234 803 XXX 5678',
      views: 32,
      requiredViews: 25,
      postedTime: '14:30',
      expiresIn: '9h 30m',
      status: 'verified',
      payment: 500
    },
    {
      id: 'STATUS-002',
      postTitle: 'Tecno Phantom X2 Pro Giveaway',
      promoter: 'Michael Chen',
      promoterPhone: '+234 701 XXX 9012',
      views: 18,
      requiredViews: 25,
      postedTime: '16:45',
      expiresIn: '7h 15m',
      status: 'active',
      payment: 400
    },
    {
      id: 'STATUS-003',
      postTitle: 'Dominos Pizza Weekend Special',
      promoter: 'Amina Ibrahim',
      promoterPhone: '+234 902 XXX 3456',
      views: 42,
      requiredViews: 25,
      postedTime: '12:20',
      expiresIn: 'Expired',
      status: 'verified',
      payment: 300
    },
    {
      id: 'STATUS-004',
      postTitle: 'Spotify Premium Offer',
      promoter: 'David Okafor',
      promoterPhone: '+234 805 XXX 7890',
      views: 12,
      requiredViews: 25,
      postedTime: '13:15',
      expiresIn: 'Expired',
      status: 'failed',
      payment: 450
    },
    {
      id: 'STATUS-005',
      postTitle: 'Nike Air Max Summer Collection',
      promoter: 'Grace Adebayo',
      promoterPhone: '+234 703 XXX 2345',
      views: 28,
      requiredViews: 25,
      postedTime: '15:30',
      expiresIn: '8h 30m',
      status: 'active',
      payment: 500
    },
    {
      id: 'STATUS-006',
      postTitle: 'Tecno Phantom X2 Pro Giveaway',
      promoter: 'Chinedu Okwu',
      promoterPhone: '+234 806 XXX 6789',
      views: 35,
      requiredViews: 25,
      postedTime: '11:45',
      expiresIn: 'Expired',
      status: 'verified',
      payment: 400
    }
  ];
  
  // Computed filtered data
  filteredPosts = computed(() => {
    return this.promotionPosts;
  });
  
  filteredStatusPromotions = computed(() => {
    return this.statusPromotions;
  });
  
  // Expose Math to template
  Math = Math;


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
    
    this.revenueService.getRevenueStats()
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
    
    this.revenueService.getEngagementStats()
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
  
  // Action methods
  viewPost(post: PromotionPost) {
    console.log('Viewing post:', post);
  }
  
  editPost(post: PromotionPost) {
    console.log('Editing post:', post);
  }
}