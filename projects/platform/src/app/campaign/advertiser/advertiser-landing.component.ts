import { Component, OnInit, inject, signal, computed, Input, Signal, OnDestroy } from '@angular/core';
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
import { CampaingService } from '../campaign.service';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CampaignInterface } from '../../common/models/campaigns';
import { formatRemainingDays, isDatePast, CampaignStats } from '../../common/utils/time.util';
import { ShortNumberPipe } from '../../common/pipes/short-number.pipe';
import { CategoryPlaceholderPipe } from '../../common/pipes/category-placeholder.pipe';

@Component({
  selector: 'advertiser-campaign-landing',
  standalone: true,
  providers: [CampaingService],
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
    ShortNumberPipe,
    CategoryPlaceholderPipe
  ],
  templateUrl: './advertiser-landing.component.html',
  styleUrls: ['./advertiser-landing.component.scss']
})
export class AdvertiserCampaignLandingComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private deviceService = inject(DeviceService);
  private campaingService = inject(CampaingService);
  private snackBar = inject(MatSnackBar);

  // Signals for reactive state management
  campaigns = signal<CampaignInterface[]>([]);
  filteredCampaigns = signal<CampaignInterface[]>([]);
  currentFilter = signal<string>('pending-and-active'); // Default to 'pending-and-active'
  isLoading = signal(false);

  // Computed properties
  deviceType = computed(() => this.deviceService.type());
  campaignStats = computed(() => this.calculateStats());

  // Required input that expects a signal of type UserInterface or undefined
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadCampaigns();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadCampaigns(): void {
    if (this.user() && this.user()?._id) {
      this.isLoading.set(true);
      this.subscriptions.push(
        this.campaingService.getAdvertiserCampaign(this.user()!._id!).subscribe({
          next: (response) => {
            const campaignsWithMetrics = this.calculateCampaignMetrics(response.data);
            this.campaigns.set(campaignsWithMetrics);
            this.isLoading.set(false);
            
            // --- FIX 1: Trigger the filtering after data is successfully loaded ---
            this.filterCampaigns(this.currentFilter()); 
          },
          error: (error: HttpErrorResponse) => {
            // const errorMessage = error.error?.message || 'Failed to load campaign. Please try again.';
            // this.snackBar.open(errorMessage, 'Close', {
            //   duration: 3000,
            // });
            this.isLoading.set(false);
          }
        })
      );
    }
  }

  private calculateCampaignMetrics(campaigns: CampaignInterface[]): CampaignInterface[] {
    return campaigns.map(campaign => {
      const updatedCampaign = { ...campaign };

      updatedCampaign.progress = (campaign.spentBudget / campaign.budget) * 100;

      if (campaign.endDate) {
        const endDate = new Date(campaign.endDate);
        if (isDatePast(endDate)) {
          updatedCampaign.remainingDays = 'Expired';
        } else {
          updatedCampaign.remainingDays = formatRemainingDays(endDate);
        }
      } else {
        const budgetRemaining = updatedCampaign.budget - updatedCampaign.spentBudget;
        if (budgetRemaining <= 0) {
          updatedCampaign.remainingDays = 'Budget Exhausted';
        } else {
          updatedCampaign.remainingDays = 'Budget-based';
        }
      }

      return updatedCampaign;
    });
  }

  private calculateStats(): CampaignStats {
    const campaigns = this.campaigns();
    const activeCampaigns = campaigns.filter(c => c.status === 'active');

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: activeCampaigns.length,
      totalSpent: campaigns.reduce((sum, c) => sum + (c.spentBudget || 0), 0),
      totalViews: campaigns.reduce((sum, c) => sum + (c.views || 0), 0),
      avgCTR: 3.2, // Mock value
      totalPromoters: campaigns.reduce((sum, c) => sum + (c.totalPromotions || 0), 0)
    };
  }

  // Navigation methods
  allCampaigns(): void {
    this.router.navigate(['/dashboard/campaigns/all']);
  }

  createCampaign(): void {
    this.router.navigate(['/dashboard/campaigns/create']);
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
    this.router.navigate(['/dashboard/campaigns/all']);
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

  // Corrected filterCampaigns() method
  filterCampaigns(filter: string): void {
    //console.log('Filtering campaigns by:', filter);
    this.currentFilter.set(filter);
    const campaigns = this.campaigns();
    
    let filteredList: CampaignInterface[] = [];

    if (filter === 'all') {
      filteredList = campaigns;
    } else if (filter === 'pending-and-active') {
      // New logic to filter for multiple statuses
      filteredList = campaigns.filter(c => c.status === 'active' || c.status === 'pending');
    } else {
      filteredList = campaigns.filter(c => c.status === filter);
    }
    
    this.filteredCampaigns.set(filteredList);
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

}