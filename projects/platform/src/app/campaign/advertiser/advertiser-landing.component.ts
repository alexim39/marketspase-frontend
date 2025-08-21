
import { Component, OnInit, inject, signal, computed, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { DeviceService } from '../../common/services/device.service';
import { UserInterface } from '../../common/services/user.service';

interface Campaign {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  budget: number;
  spent: number;
  payoutPerPromotion: number;
  maxPromoters: number;
  currentPromoters: number;
  views: number;
  estimatedReach: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  mediaUrl?: string;
  category: string;
  progress: number;
  remainingDays: number;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
  totalViews: number;
  avgCTR: number;
  totalPromoters: number;
}

@Component({
  selector: 'advertiser-campaign-landing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatMenuModule,
    MatTabsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTooltipModule,
    MatBottomSheetModule
  ],
  template: `
    <div class="campaign-landing-container">
      <!-- Header Section -->
      <div class="campaign-header">
        <div class="header-content">
          <div class="title-section">
            <h1>Campaign Dashboard</h1>
            <p>Manage your WhatsApp Status promotions</p>
          </div>
          
          <div class="header-actions">
            <button mat-fab 
                    color="primary" 
                    class="create-campaign-fab"
                    (click)="createCampaign()"
                    matTooltip="Create New Campaign">
              <mat-icon>add</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card total-campaigns">
            <div class="stat-icon">
              <mat-icon>campaign</mat-icon>
            </div>
            <div class="stat-content">
              <h3>{{campaignStats().totalCampaigns}}</h3>
              <p>Total Campaigns</p>
              <div class="stat-change positive">
                <mat-icon>trending_up</mat-icon>
                <span>+12% this month</span>
              </div>
            </div>
          </div>

          <div class="stat-card active-campaigns">
            <div class="stat-icon">
              <mat-icon>play_circle</mat-icon>
            </div>
            <div class="stat-content">
              <h3>{{campaignStats().activeCampaigns}}</h3>
              <p>Active Campaigns</p>
              <div class="stat-change">
                <mat-icon>radio_button_checked</mat-icon>
                <span>Running now</span>
              </div>
            </div>
          </div>

          <div class="stat-card total-spent">
            <div class="stat-icon">
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <div class="stat-content">
              <h3>{{campaignStats().totalSpent | currency:'NGN':'symbol':'1.0-0'}}</h3>
              <p>Total Spent</p>
              <div class="stat-change neutral">
                <mat-icon>remove</mat-icon>
                <span>This month</span>
              </div>
            </div>
          </div>

          <div class="stat-card total-views">
            <div class="stat-icon">
              <mat-icon>visibility</mat-icon>
            </div>
            <div class="stat-content">
              <h3>{{formatNumber(campaignStats().totalViews)}}</h3>
              <p>Total Views</p>
              <div class="stat-change positive">
                <mat-icon>trending_up</mat-icon>
                <span>+24% reach</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions-section">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <div class="action-card create-action" (click)="createCampaign()">
            <div class="action-icon">
              <mat-icon>add_circle</mat-icon>
            </div>
            <h3>Create Campaign</h3>
            <p>Launch a new WhatsApp Status promotion</p>
          </div>

          <div class="action-card analytics-action" (click)="viewAnalytics()">
            <div class="action-icon">
              <mat-icon>analytics</mat-icon>
            </div>
            <h3>View Analytics</h3>
            <p>Detailed insights and performance metrics</p>
          </div>

          <div class="action-card templates-action" (click)="viewTemplates()">
            <div class="action-icon">
              <mat-icon>library_books</mat-icon>
            </div>
            <h3>Campaign Templates</h3>
            <p>Pre-made templates for quick setup</p>
          </div>

          <div class="action-card history-action" (click)="viewHistory()">
            <div class="action-icon">
              <mat-icon>history</mat-icon>
            </div>
            <h3>Campaign History</h3>
            <p>View all past and completed campaigns</p>
          </div>
        </div>
      </div>

      <!-- Active Campaigns -->
      <div class="campaigns-section">
        <div class="section-header">
          <h2>Active Campaigns</h2>
          <div class="header-controls">
            <button mat-stroked-button [matMenuTriggerFor]="filterMenu">
              <mat-icon>filter_list</mat-icon>
              Filter
            </button>
            <mat-menu #filterMenu="matMenu">
              <button mat-menu-item (click)="filterCampaigns('all')">All Campaigns</button>
              <button mat-menu-item (click)="filterCampaigns('active')">Active Only</button>
              <button mat-menu-item (click)="filterCampaigns('paused')">Paused</button>
              <button mat-menu-item (click)="filterCampaigns('draft')">Drafts</button>
            </mat-menu>
            
            <button mat-stroked-button (click)="viewAllCampaigns()">
              View All
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>

        @if (filteredCampaigns().length > 0) {
          <div class="campaigns-grid">
            @for (campaign of filteredCampaigns().slice(0, 6); track campaign.id) {
              <div class="campaign-card" [class]="'status-' + campaign.status">
                <div class="campaign-header">
                  <div class="campaign-status">
                    <mat-chip class="status-chip" [class]="'status-' + campaign.status">
                      <mat-icon>{{getStatusIcon(campaign.status)}}</mat-icon>
                      {{campaign.status | titlecase}}
                    </mat-chip>
                  </div>
                  
                  <button mat-icon-button [matMenuTriggerFor]="campaignMenu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #campaignMenu="matMenu">
                    <button mat-menu-item (click)="editCampaign(campaign.id)">
                      <mat-icon>edit</mat-icon>
                      Edit
                    </button>
                    <button mat-menu-item (click)="viewCampaignDetails(campaign.id)">
                      <mat-icon>visibility</mat-icon>
                      View Details
                    </button>
                    @if (campaign.status === 'active') {
                      <button mat-menu-item (click)="pauseCampaign(campaign.id)">
                        <mat-icon>pause</mat-icon>
                        Pause
                      </button>
                    }
                    @if (campaign.status === 'paused') {
                      <button mat-menu-item (click)="resumeCampaign(campaign.id)">
                        <mat-icon>play_arrow</mat-icon>
                        Resume
                      </button>
                    }
                  </mat-menu>
                </div>

                @if (campaign.mediaUrl) {
                  <div class="campaign-media">
                    <img [src]="campaign.mediaUrl" [alt]="campaign.title" class="media-preview">
                  </div>
                }

                <div class="campaign-content">
                  <h3 class="campaign-title">{{campaign.title}}</h3>
                  <p class="campaign-description">{{campaign.description}}</p>
                  
                  <div class="campaign-metrics">
                    <div class="metric">
                      <mat-icon>group</mat-icon>
                      <span>{{campaign.currentPromoters}}/{{campaign.maxPromoters}}</span>
                    </div>
                    <div class="metric">
                      <mat-icon>visibility</mat-icon>
                      <span>{{formatNumber(campaign.views)}}</span>
                    </div>
                    <div class="metric">
                      <mat-icon>schedule</mat-icon>
                      <span>{{campaign.remainingDays}}d left</span>
                    </div>
                  </div>

                  <div class="campaign-progress">
                    <div class="progress-header">
                      <span class="progress-label">Progress</span>
                      <span class="progress-value">{{campaign.progress}}%</span>
                    </div>
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="campaign.progress"
                      [class]="'progress-' + getProgressColor(campaign.progress)">
                    </mat-progress-bar>
                  </div>

                  <div class="campaign-budget">
                    <div class="budget-info">
                      <span class="spent">{{campaign.spent | currency:'NGN':'symbol':'1.0-0'}}</span>
                      <span class="separator">/</span>
                      <span class="total">{{campaign.budget | currency:'NGN':'symbol':'1.0-0'}}</span>
                    </div>
                    <span class="budget-label">Budget Used</span>
                  </div>
                </div>

                <div class="campaign-actions">
                  <button mat-stroked-button (click)="viewCampaignDetails(campaign.id)" class="view-details-btn">
                    <mat-icon>analytics</mat-icon>
                    View Details
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-illustration">
              <mat-icon>campaign</mat-icon>
            </div>
            <h3>No Active Campaigns</h3>
            <p>Create your first campaign to start promoting on WhatsApp Status</p>
            <button mat-flat-button color="primary" (click)="createCampaign()">
              <mat-icon>add</mat-icon>
              Create Campaign
            </button>
          </div>
        }
      </div>

      <!-- Recent Activity -->
      @if (deviceType() === 'desktop') {
        <div class="activity-section">
          <h2>Recent Activity</h2>
          <div class="activity-list">
            <div class="activity-item">
              <div class="activity-icon success">
                <mat-icon>check_circle</mat-icon>
              </div>
              <div class="activity-content">
                <p><strong>Summer Sale Campaign</strong> reached 1,000 views</p>
                <span class="activity-time">2 hours ago</span>
              </div>
            </div>

            <div class="activity-item">
              <div class="activity-icon info">
                <mat-icon>person_add</mat-icon>
              </div>
              <div class="activity-content">
                <p><strong>Product Launch</strong> gained 5 new promoters</p>
                <span class="activity-time">4 hours ago</span>
              </div>
            </div>

            <div class="activity-item">
              <div class="activity-icon warning">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="activity-content">
                <p><strong>Brand Awareness</strong> campaign expires in 2 days</p>
                <span class="activity-time">6 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Mobile FAB for quick actions -->
      @if (deviceType() !== 'desktop') {
        <div class="mobile-fab-container">
          <button mat-fab color="primary" class="main-fab" (click)="createCampaign()">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./advertiser-landing.component.scss']
})
export class AdvertiserCampaignLandingComponent implements OnInit {
  private router = inject(Router);
  private deviceService = inject(DeviceService);

  // Signals for reactive state management
  campaigns = signal<Campaign[]>([]);
  filteredCampaigns = signal<Campaign[]>([]);
  currentFilter = signal<string>('active');
  isLoading = signal(false);

  // Computed properties
  deviceType = computed(() => this.deviceService.type());
  campaignStats = computed(() => this.calculateStats());

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  ngOnInit(): void {
    this.loadCampaigns();
    this.filterCampaigns('active');
  }

  private loadCampaigns(): void {
    // Mock data - replace with actual service call
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        title: 'Summer Fashion Sale',
        description: 'Promote our latest summer collection with exclusive discounts',
        status: 'active',
        budget: 50000,
        spent: 32000,
        payoutPerPromotion: 200,
        maxPromoters: 250,
        currentPromoters: 160,
        views: 8500,
        estimatedReach: 12500,
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-08-30'),
        createdAt: new Date('2024-08-14'),
        mediaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
        category: 'fashion',
        progress: 64,
        remainingDays: 6
      },
      {
        id: '2',
        title: 'Tech Product Launch',
        description: 'Introduce our revolutionary smartphone to the market',
        status: 'active',
        budget: 100000,
        spent: 45000,
        payoutPerPromotion: 200,
        maxPromoters: 500,
        currentPromoters: 225,
        views: 15200,
        estimatedReach: 25000,
        startDate: new Date('2024-08-10'),
        endDate: new Date('2024-09-10'),
        createdAt: new Date('2024-08-09'),
        mediaUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
        category: 'tech',
        progress: 45,
        remainingDays: 12
      },
      {
        id: '3',
        title: 'Restaurant Grand Opening',
        description: 'Celebrate our grand opening with special offers',
        status: 'paused',
        budget: 25000,
        spent: 8000,
        payoutPerPromotion: 200,
        maxPromoters: 125,
        currentPromoters: 40,
        views: 2100,
        estimatedReach: 6250,
        startDate: new Date('2024-08-20'),
        endDate: new Date('2024-08-27'),
        createdAt: new Date('2024-08-19'),
        mediaUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        category: 'food',
        progress: 32,
        remainingDays: 3
      }
    ];

    this.campaigns.set(mockCampaigns);
  }

  private calculateStats(): CampaignStats {
    const campaigns = this.campaigns();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalSpent: campaigns.reduce((sum, c) => sum + c.spent, 0),
      totalViews: campaigns.reduce((sum, c) => sum + c.views, 0),
      avgCTR: 3.2, // Mock value
      totalPromoters: campaigns.reduce((sum, c) => sum + c.currentPromoters, 0)
    };
  }

  // Navigation methods
  createCampaign(): void {
    this.router.navigate(['/campaigns/create']);
  }

  viewAnalytics(): void {
    this.router.navigate(['/campaigns/analytics']);
  }

  viewTemplates(): void {
    this.router.navigate(['/campaigns/templates']);
  }

  viewHistory(): void {
    this.router.navigate(['/campaigns/history']);
  }

  viewAllCampaigns(): void {
    this.router.navigate(['/campaigns/all']);
  }

  viewCampaignDetails(campaignId: string): void {
    this.router.navigate(['/campaigns', campaignId]);
  }

  editCampaign(campaignId: string): void {
    this.router.navigate(['/campaigns', campaignId, 'edit']);
  }

  // Campaign actions
  pauseCampaign(campaignId: string): void {
    console.log('Pausing campaign:', campaignId);
    // Implement pause logic
  }

  resumeCampaign(campaignId: string): void {
    console.log('Resuming campaign:', campaignId);
    // Implement resume logic
  }

  // Filter methods
  filterCampaigns(filter: string): void {
    this.currentFilter.set(filter);
    const campaigns = this.campaigns();
    
    if (filter === 'all') {
      this.filteredCampaigns.set(campaigns);
    } else {
      this.filteredCampaigns.set(campaigns.filter(c => c.status === filter));
    }
  }

  // Utility methods
  getStatusIcon(status: string): string {
    const icons = {
      'active': 'play_circle',
      'paused': 'pause_circle',
      'draft': 'edit',
      'completed': 'check_circle',
      'expired': 'schedule'
    };
    return icons[status as keyof typeof icons] || 'help';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'danger';
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}