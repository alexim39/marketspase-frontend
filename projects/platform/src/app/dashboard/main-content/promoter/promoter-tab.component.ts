import { Component, OnInit, OnDestroy, inject, signal, computed, Signal, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { CampaignInterface, DeviceService, UserInterface } from '../../../../../../shared-services/src/public-api';
import { CampaignService } from '../../../campaign/campaign.service';
import { CategoryPlaceholderPipe } from '../../../common/pipes/category-placeholder.pipe';
import { formatRemainingDays, isDatePast } from '../../../common/utils/time.util';


export interface Earning {
  id: string;
  campaignTitle: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid';
  date: Date;
  proofSubmitted: boolean;
  advertiser: string;
}


@Component({
  selector: 'promoter-tab',
  providers: [CampaignService],
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule,
    MatBadgeModule,
    MatChipsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTableModule,
    MatDialogModule,
    MatTooltipModule,
    CategoryPlaceholderPipe
  ],
  templateUrl: './promoter-tab.component.html',
  styleUrls: ['./promoter-tab.component.scss'],
})
export class PromoterTabComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  private campaignService = inject(CampaignService);
  private readonly deviceService = inject(DeviceService);
  // Computed properties for better performance
  protected readonly deviceType = computed(() => this.deviceService.type());
  public readonly api = this.campaignService.api;


  //readonly user = input.required<UserInterface | null>();
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  isLoading = signal(false);
  // Signals for reactive state management
  campaigns = signal<CampaignInterface[]>([]);

  // campaigns = signal<Campaign[]>([
  //   {
  //     id: '1',
  //     title: 'Summer Fashion Collection',
  //     description: 'Promote our latest summer fashion collection with vibrant designs',
  //     budget: 50000,
  //     spent: 32000,
  //     reach: 15000,
  //     status: 'active',
  //     deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //     imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
  //     promoters: 20,
  //     viewsRequired: 25000,
  //     currentViews: 15000
  //   },
  //   {
  //     id: '2',
  //     title: 'Tech Gadget Launch',
  //     description: 'Launch announcement for our revolutionary smart device',
  //     budget: 75000,
  //     spent: 45000,
  //     reach: 22000,
  //     status: 'active',
  //     deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  //     imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400',
  //     promoters: 30,
  //     viewsRequired: 35000,
  //     currentViews: 22000
  //   }
  // ]);

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

  private destroy$ = new Subject<void>();

  pendingEarnings = computed(() => {
    return this.earnings()
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + e.amount, 0);
  });

  availableBalance = computed(() => {
    return this.earnings()
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + e.amount, 0);
  });

  ngOnInit(): void {
    this.loadCampaigns();
  }


  private loadCampaigns(): void {
    if (this.user() && this.user()?._id) {
      this.isLoading.set(true);
        this.campaignService.getCampaignsByStatus('active')
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
             const campaignsWithMetrics = this.calculateCampaignMetrics(response.data);
            this.campaigns.set(campaignsWithMetrics);
            this.isLoading.set(false);
          },
          error: (error: HttpErrorResponse) => {
            // const errorMessage = error.error?.message || 'Failed to load campaign. Please try again.';
            // this.snackBar.open(errorMessage, 'Close', {
            //   duration: 3000,
            // });
            this.isLoading.set(false);
          }
        })
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



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  acceptCampaign(campaignId: string): void {
    this.snackBar.open('Campaign accepted! Check your active campaigns.', 'OK', { duration: 3000 });
  }

  viewCampaignDetails(campaignId: string): void {
    this.router.navigate(['/campaign', campaignId, 'details']);
  }

  viewAllCampaigns(): void {
    this.router.navigate(['/dashboard/campaigns']);
  }

  uploadProof(earningId: string): void {
    this.snackBar.open('Proof upload feature coming soon!', 'OK', { duration: 3000 });
  }

  withdraw(): void {
    this.snackBar.open('Withdrawal feature coming soon!', 'OK', { duration: 3000 });
  }
 
}