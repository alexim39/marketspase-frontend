import { Component, OnInit, inject, signal, computed, Signal, Input } from '@angular/core';
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
import { MatSliderModule } from '@angular/material/slider';
import { DeviceService } from '../../common/services/device.service';
import { UserInterface } from '../../common/services/user.service';

interface AvailableCampaign {
  id: string;
  title: string;
  description: string;
  category: string;
  payoutPerPromotion: number;
  requirements: string[];
  duration: string;
  mediaUrl?: string;
  advertiserName: string;
  advertiserRating: number;
  totalSlots: number;
  filledSlots: number;
  estimatedViews: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  endDate: Date;
  isBookmarked: boolean;
}

interface PromoterStats {
  totalEarnings: number;
  completedCampaigns: number;
  activeCampaigns: number;
  pendingEarnings: number;
  averageRating: number;
  totalViews: number;
  thisMonthEarnings: number;
  successRate: number;
}

interface ActivePromotion {
  id: string;
  campaignTitle: string;
  status: 'posted' | 'pending_verification' | 'verified' | 'expired';
  postedAt: Date;
  expiresAt: Date;
  currentViews: number;
  requiredViews: number;
  payout: number;
  proofSubmitted: boolean;
  timeRemaining: string;
}

@Component({
  selector: 'promoter-landing',
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
    MatBottomSheetModule,
    MatSliderModule
  ],
  template: `
    <div class="promoter-landing-container">
      <!-- Header Section -->
      <div class="promoter-header">
        <div class="header-content">
          <div class="profile-section">
            <div class="user-info">
              <h1>Welcome back, John!</h1>
              <p>Ready to earn from your WhatsApp Status?</p>
              <div class="rating-display">
                <div class="stars">
                  @for (star of getStars(promoterStats().averageRating); track $index) {
                    <i class="material-icons" [class]="star.class">{{star.icon}}</i>
                  }
                </div>
                <span class="rating-text">{{promoterStats().averageRating}}/5.0</span>
              </div>
            </div>
          </div>
          
          <div class="earnings-quick-view">
            <div class="earnings-card">
              <div class="earnings-amount">
                <span class="currency">₦</span>
                <span class="amount">{{promoterStats().totalEarnings | number:'1.0-0'}}</span>
              </div>
              <p class="earnings-label">Total Earnings</p>
              <div class="earnings-change positive">
                <i class="material-icons">trending_up</i>
                <span>+₦{{promoterStats().thisMonthEarnings | number:'1.0-0'}} this month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Overview -->
      <div class="stats-section">
        <div class="stats-grid">
          <div class="stat-card active-campaigns">
            <div class="stat-icon">
              <i class="material-icons">play_circle_filled</i>
            </div>
            <div class="stat-content">
              <h3>{{promoterStats().activeCampaigns}}</h3>
              <p>Active Promotions</p>
              <div class="stat-progress">
                <div class="progress-bar" [style.width.%]="(promoterStats().activeCampaigns / 10) * 100"></div>
              </div>
            </div>
          </div>

          <div class="stat-card pending-earnings">
            <div class="stat-icon">
              <i class="material-icons">hourglass_empty</i>
            </div>
            <div class="stat-content">
              <h3>₦{{promoterStats().pendingEarnings | number:'1.0-0'}}</h3>
              <p>Pending Earnings</p>
              <div class="stat-note">
                <i class="material-icons">schedule</i>
                <span>Processing verification</span>
              </div>
            </div>
          </div>

          <div class="stat-card success-rate">
            <div class="stat-icon">
              <i class="material-icons">verified</i>
            </div>
            <div class="stat-content">
              <h3>{{promoterStats().successRate}}%</h3>
              <p>Success Rate</p>
              <div class="stat-change positive">
                <i class="material-icons">thumb_up</i>
                <span>Great performance!</span>
              </div>
            </div>
          </div>

          <div class="stat-card total-views">
            <div class="stat-icon">
              <i class="material-icons">visibility</i>
            </div>
            <div class="stat-content">
              <h3>{{formatNumber(promoterStats().totalViews)}}</h3>
              <p>Total Views Generated</p>
              <div class="stat-change neutral">
                <i class="material-icons">insights</i>
                <span>Lifetime reach</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Promotions Alert -->
      @if (activePromotions().length > 0) {
        <div class="active-promotions-alert">
          <div class="alert-content">
            <div class="alert-icon">
              <i class="material-icons">notification_important</i>
            </div>
            <div class="alert-text">
              <h3>You have {{activePromotions().length}} active promotion(s)</h3>
              <p>Don't forget to submit your proof screenshots before expiry</p>
            </div>
            <button class="view-active-btn" (click)="viewActivePromotions()">
              View Active
              <i class="material-icons">arrow_forward</i>
            </button>
          </div>
        </div>
      }

      <!-- Quick Actions -->
      <div class="quick-actions-section">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <div class="action-card browse-action" (click)="browseCampaigns()">
            <div class="action-icon">
              <i class="material-icons">search</i>
            </div>
            <h3>Browse Campaigns</h3>
            <p>Find new campaigns to promote</p>
            <div class="action-badge">
              <span>{{availableCampaigns().length}} Available</span>
            </div>
          </div>

          <div class="action-card earnings-action" (click)="viewEarnings()">
            <div class="action-icon">
              <i class="material-icons">account_balance_wallet</i>
            </div>
            <h3>My Earnings</h3>
            <p>Track payments and withdrawals</p>
            <div class="action-badge pending">
              <span>₦{{promoterStats().pendingEarnings | number:'1.0-0'}} Pending</span>
            </div>
          </div>

          <div class="action-card history-action" (click)="viewHistory()">
            <div class="action-icon">
              <i class="material-icons">history</i>
            </div>
            <h3>Promotion History</h3>
            <p>View past campaigns and performance</p>
          </div>

          <div class="action-card support-action" (click)="getSupport()">
            <div class="action-icon">
              <i class="material-icons">help_center</i>
            </div>
            <h3>Help & Support</h3>
            <p>Get assistance and tips</p>
          </div>
        </div>
      </div>

      <!-- Available Campaigns -->
      <div class="campaigns-section">
        <div class="section-header">
          <h2>Available Campaigns</h2>
          <div class="header-controls">
            <div class="payout-filter">
              <label>Min Payout:</label>
              <input type="range" 
                     min="100" 
                     max="1000" 
                     step="50" 
                     [value]="minPayoutFilter()" 
                     (input)="updatePayoutFilter($event)"
                     class="payout-slider">
              <span class="filter-value">₦{{minPayoutFilter()}}</span>
            </div>
            
            <button class="filter-btn" [class.active]="currentCategoryFilter() !== 'all'" (click)="toggleCategoryFilter()">
              <i class="material-icons">filter_list</i>
              Filter
              @if (currentCategoryFilter() !== 'all') {
                <span class="filter-indicator">1</span>
              }
            </button>
            
            <button class="view-all-btn" (click)="viewAllCampaigns()">
              View All
              <i class="material-icons">arrow_forward</i>
            </button>
          </div>
        </div>

        @if (filteredCampaigns().length > 0) {
          <div class="campaigns-grid">
            @for (campaign of filteredCampaigns().slice(0, 6); track campaign.id) {
              <div class="campaign-card" [class]="'difficulty-' + campaign.difficulty">
                <div class="campaign-header">
                  <div class="campaign-category">
                    <span class="category-chip">{{campaign.category | titlecase}}</span>
                  </div>
                  
                  <div class="campaign-actions">
                    <button class="bookmark-btn" 
                            [class.bookmarked]="campaign.isBookmarked"
                            (click)="toggleBookmark(campaign.id)">
                      <i class="material-icons">{{campaign.isBookmarked ? 'bookmark' : 'bookmark_border'}}</i>
                    </button>
                    
                    <button class="menu-btn">
                      <i class="material-icons">more_vert</i>
                    </button>
                  </div>
                </div>

                @if (campaign.mediaUrl) {
                  <div class="campaign-media">
                    <img [src]="campaign.mediaUrl" [alt]="campaign.title" class="media-preview">
                    <div class="media-overlay">
                      <button class="preview-btn" (click)="previewMedia(campaign.id)">
                        <i class="material-icons">play_circle_filled</i>
                      </button>
                    </div>
                  </div>
                }

                <div class="campaign-content">
                  <div class="advertiser-info">
                    <div class="advertiser-name">{{campaign.advertiserName}}</div>
                    <div class="advertiser-rating">
                      <i class="material-icons">star</i>
                      <span>{{campaign.advertiserRating}}</span>
                    </div>
                  </div>

                  <h3 class="campaign-title">{{campaign.title}}</h3>
                  <p class="campaign-description">{{campaign.description}}</p>

                  <div class="campaign-requirements">
                    <h4>Requirements:</h4>
                    <ul class="requirements-list">
                      @for (requirement of campaign.requirements.slice(0, 2); track requirement) {
                        <li>{{requirement}}</li>
                      }
                      @if (campaign.requirements.length > 2) {
                        <li class="more-requirements">+{{campaign.requirements.length - 2}} more...</li>
                      }
                    </ul>
                  </div>

                  <div class="campaign-metrics">
                    <div class="metric">
                      <i class="material-icons">people</i>
                      <span>{{campaign.filledSlots}}/{{campaign.totalSlots}}</span>
                    </div>
                    <div class="metric">
                      <i class="material-icons">schedule</i>
                      <span>{{campaign.duration}}</span>
                    </div>
                    <div class="metric">
                      <i class="material-icons">visibility</i>
                      <span>~{{campaign.estimatedViews}} views</span>
                    </div>
                  </div>

                  <div class="campaign-tags">
                    @for (tag of campaign.tags.slice(0, 3); track tag) {
                      <span class="tag">{{tag}}</span>
                    }
                  </div>

                  <div class="campaign-payout">
                    <div class="payout-amount">
                      <span class="amount">₦{{campaign.payoutPerPromotion}}</span>
                      <span class="per-post">per post</span>
                    </div>
                    <div class="difficulty-indicator">
                      <span class="difficulty-label">{{campaign.difficulty | titlecase}}</span>
                      <div class="difficulty-dots">
                        @for (dot of getDifficultyDots(campaign.difficulty); track $index) {
                          <div class="dot" [class.active]="dot"></div>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="campaign-urgency">
                    <i class="material-icons">schedule</i>
                    <span>Ends {{getTimeUntilEnd(campaign.endDate)}}</span>
                  </div>
                </div>

                <div class="campaign-footer">
                  <div class="slots-progress">
                    <div class="progress-label">
                      <span>{{campaign.totalSlots - campaign.filledSlots}} slots left</span>
                    </div>
                    <div class="progress-bar-container">
                      <div class="progress-bar" [style.width.%]="(campaign.filledSlots / campaign.totalSlots) * 100"></div>
                    </div>
                  </div>
                  
                  <button class="apply-btn" 
                          [disabled]="campaign.filledSlots >= campaign.totalSlots"
                          (click)="applyCampaign(campaign.id)">
                    @if (campaign.filledSlots >= campaign.totalSlots) {
                      <i class="material-icons">block</i>
                      Full
                    } @else {
                      <i class="material-icons">add_circle</i>
                      Apply Now
                    }
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-illustration">
              <i class="material-icons">search_off</i>
            </div>
            <h3>No Campaigns Found</h3>
            <p>Try adjusting your filters or check back later for new opportunities</p>
            <button class="reset-filters-btn" (click)="resetFilters()">
              <i class="material-icons">clear_all</i>
              Reset Filters
            </button>
          </div>
        }
      </div>

      <!-- Performance Tips -->
      <div class="tips-section">
        <h2>Performance Tips</h2>
        <div class="tips-grid">
          <div class="tip-card">
            <div class="tip-icon">
              <i class="material-icons">camera_alt</i>
            </div>
            <h4>Quality Screenshots</h4>
            <p>Always submit clear, high-quality proof screenshots to ensure quick verification</p>
          </div>
          
          <div class="tip-card">
            <div class="tip-icon">
              <i class="material-icons">schedule</i>
            </div>
            <h4>Post at Peak Hours</h4>
            <p>Share status updates during 6-9 PM for maximum views and engagement</p>
          </div>
          
          <div class="tip-card">
            <div class="tip-icon">
              <i class="material-icons">groups</i>
            </div>
            <h4>Engage Your Audience</h4>
            <p>Build an active contact list for consistent views on your status updates</p>
          </div>
        </div>
      </div>

      <!-- Mobile FAB -->
      @if (deviceType() !== 'desktop') {
        <div class="mobile-fab-container">
          <button class="main-fab" (click)="browseCampaigns()">
            <i class="material-icons">search</i>
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./promoter-landing.component.scss']
})
export class PromoterLandingComponent implements OnInit {
  private router = inject(Router);
  private deviceService = inject(DeviceService);

  // Signals for reactive state management
  availableCampaigns = signal<AvailableCampaign[]>([]);
  filteredCampaigns = signal<AvailableCampaign[]>([]);
  activePromotions = signal<ActivePromotion[]>([]);
  minPayoutFilter = signal<number>(200);
  currentCategoryFilter = signal<string>('all');
  isLoading = signal(false);

  // Computed properties
  deviceType = computed(() => this.deviceService.type());
  promoterStats = computed(() => this.calculateStats());

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  ngOnInit(): void {
    this.loadAvailableCampaigns();
    this.loadActivePromotions();
    this.filterCampaigns();
  }

  private loadAvailableCampaigns(): void {
    // Mock data - replace with actual service call
    const mockCampaigns: AvailableCampaign[] = [
      {
        id: '1',
        title: 'Fashion Summer Sale 2024',
        description: 'Promote our exclusive summer fashion collection with amazing discounts',
        category: 'fashion',
        payoutPerPromotion: 300,
        requirements: ['25+ status views', 'Active for 24 hours', 'Include provided hashtags'],
        duration: '24 hours',
        mediaUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
        advertiserName: 'StyleHub NG',
        advertiserRating: 4.8,
        totalSlots: 100,
        filledSlots: 67,
        estimatedViews: 45,
        difficulty: 'easy',
        tags: ['fashion', 'sale', 'summer'],
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        isBookmarked: false
      },
      {
        id: '2',
        title: 'New Smartphone Launch',
        description: 'Help us introduce the latest smartphone with cutting-edge features',
        category: 'tech',
        payoutPerPromotion: 500,
        requirements: ['50+ status views', 'Tech-savvy audience', 'Post during peak hours'],
        duration: '24 hours',
        mediaUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
        advertiserName: 'TechWorld',
        advertiserRating: 4.6,
        totalSlots: 50,
        filledSlots: 23,
        estimatedViews: 75,
        difficulty: 'medium',
        tags: ['tech', 'smartphone', 'launch'],
        endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        isBookmarked: true
      },
      {
        id: '3',
        title: 'Restaurant Grand Opening',
        description: 'Celebrate our grand opening with special food offers and discounts',
        category: 'food',
        payoutPerPromotion: 250,
        requirements: ['Local audience', '30+ status views', 'Share location tag'],
        duration: '24 hours',
        mediaUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        advertiserName: 'Delicious Bites',
        advertiserRating: 4.5,
        totalSlots: 75,
        filledSlots: 75,
        estimatedViews: 35,
        difficulty: 'easy',
        tags: ['food', 'restaurant', 'opening'],
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        isBookmarked: false
      },
      {
        id: '4',
        title: 'Fitness Challenge 30-Day',
        description: 'Promote our 30-day fitness transformation challenge program',
        category: 'health',
        payoutPerPromotion: 400,
        requirements: ['Health-conscious audience', '40+ status views', 'Engage with comments'],
        duration: '24 hours',
        mediaUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
        advertiserName: 'FitLife Academy',
        advertiserRating: 4.7,
        totalSlots: 60,
        filledSlots: 42,
        estimatedViews: 55,
        difficulty: 'medium',
        tags: ['fitness', 'health', 'challenge'],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isBookmarked: true
      }
    ];

    this.availableCampaigns.set(mockCampaigns);
  }

  private loadActivePromotions(): void {
    const mockActivePromotions: ActivePromotion[] = [
      {
        id: '1',
        campaignTitle: 'Fashion Summer Sale 2024',
        status: 'posted',
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000),
        currentViews: 18,
        requiredViews: 25,
        payout: 300,
        proofSubmitted: false,
        timeRemaining: '22h remaining'
      }
    ];

    this.activePromotions.set(mockActivePromotions);
  }

  private calculateStats(): PromoterStats {
    return {
      totalEarnings: 125750,
      completedCampaigns: 47,
      activeCampaigns: this.activePromotions().length,
      pendingEarnings: 1200,
      averageRating: 4.6,
      totalViews: 23450,
      thisMonthEarnings: 15200,
      successRate: 94
    };
  }

  // Navigation methods
  browseCampaigns(): void {
    this.router.navigate(['/promoter/campaigns/browse']);
  }

  viewEarnings(): void {
    this.router.navigate(['/promoter/earnings']);
  }

  viewHistory(): void {
    this.router.navigate(['/promoter/history']);
  }

  getSupport(): void {
    this.router.navigate(['/promoter/support']);
  }

  viewActivePromotions(): void {
    this.router.navigate(['/promoter/active']);
  }

  viewAllCampaigns(): void {
    this.router.navigate(['/promoter/campaigns/all']);
  }

  // Campaign actions
  applyCampaign(campaignId: string): void {
    console.log('Applying for campaign:', campaignId);
    this.router.navigate(['/promoter/campaigns', campaignId, 'apply']);
  }

  toggleBookmark(campaignId: string): void {
    const campaigns = this.availableCampaigns();
    const updatedCampaigns = campaigns.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, isBookmarked: !campaign.isBookmarked }
        : campaign
    );
    this.availableCampaigns.set(updatedCampaigns);
    this.filterCampaigns();
  }

  previewMedia(campaignId: string): void {
    console.log('Previewing media for campaign:', campaignId);
    // Implement media preview modal
  }

  // Filter methods
  updatePayoutFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.minPayoutFilter.set(parseInt(target.value));
    this.filterCampaigns();
  }

  toggleCategoryFilter(): void {
    // Implement category filter logic
    console.log('Toggle category filter');
  }

  resetFilters(): void {
    this.minPayoutFilter.set(200);
    this.currentCategoryFilter.set('all');
    this.filterCampaigns();
  }

  private filterCampaigns(): void {
    const campaigns = this.availableCampaigns();
    const minPayout = this.minPayoutFilter();
    
    const filtered = campaigns.filter(campaign => 
      campaign.payoutPerPromotion >= minPayout
    );
    
    this.filteredCampaigns.set(filtered);
  }

  // Utility methods
  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getStars(rating: number): Array<{icon: string, class: string}> {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push({ icon: 'star', class: 'star-full' });
    }

    if (hasHalfStar) {
      stars.push({ icon: 'star_half', class: 'star-half' });
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push({ icon: 'star_border', class: 'star-empty' });
    }

    return stars;
  }

  getDifficultyDots(difficulty: string): boolean[] {
    switch (difficulty) {
      case 'easy': return [true, false, false];
      case 'medium': return [true, true, false];
      case 'hard': return [true, true, true];
      default: return [false, false, false];
    }
  }

  getTimeUntilEnd(endDate: Date): string {
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();
    const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (days === 1) return 'tomorrow';
    if (days <= 7) return `in ${days} days`;
    return 'soon';
  }
}