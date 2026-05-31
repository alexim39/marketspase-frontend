import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PromotionInterface } from '@shared/services';
import { ShortNumberPipe } from '../../../common/pipes/short-number.pipe';
import { CampaignDetailsComponent } from '../campaign-details.component';
import { CampaignDetailsService } from '../campaign-details.service';

interface MobileMetricCard {
  icon: string;
  label: string;
  value: string;
  detail: string;
  tone: 'primary' | 'success' | 'warn' | 'info';
}

interface MobileCampaignInfoItem {
  icon: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-campaign-details-mobile',
  standalone: true,
  providers: [CampaignDetailsService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    ShortNumberPipe,
  ],
  templateUrl: './campaign-details-mobile.component.html',
  styleUrls: ['./campaign-details-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignDetailsMobileComponent extends CampaignDetailsComponent {
  protected readonly statusFilters = [
    { label: 'All', value: '' },
    { label: 'Active', value: 'accepted' },
    { label: 'Paid', value: 'paid' },
    { label: 'Rejected', value: 'rejected' },
  ];

  protected readonly canTopUpCampaign = computed(() => {
    const status = String(this.campaign()?.status || '').toLowerCase();
    return ['active', 'paused', 'exhausted'].includes(status);
  });

  protected readonly primaryMetricCards = computed<MobileMetricCard[]>(() => {
    const campaign = this.campaign();
    const currency = campaign?.currency || 'NGN';

    return [
      {
        icon: 'ads_click',
        label: 'Tracked clicks',
        value: this.formatCompactNumber(this.totalClicks()),
        detail: `${this.formatCompactNumber(this.billableClicks())} billable, ${this.formatCompactNumber(this.invalidClicks())} invalid`,
        tone: 'primary',
      },
      {
        icon: 'payments',
        label: 'Spent',
        value: this.formatCurrency(Number(campaign?.spentBudget || 0), currency),
        detail: `${this.formatCurrency(this.remainingBudget(), currency)} remaining`,
        tone: 'success',
      },
      {
        icon: 'verified',
        label: 'Click quality',
        value: `${Math.round(this.clickQualityRate())}%`,
        detail: `Avg CPC ${this.formatCurrency(this.averageCostPerBillableClick(), currency)}`,
        tone: 'info',
      },
      {
        icon: 'group',
        label: 'Promoters',
        value: this.formatCompactNumber(this.engagedPromoters()),
        detail: `${this.formatCompactNumber(this.activePromotionCount())} active promotions`,
        tone: 'warn',
      },
    ];
  });

  protected readonly campaignInfo = computed<MobileCampaignInfoItem[]>(() => {
    const campaign = this.campaign();
    if (!campaign) {
      return [];
    }

    return [
      { icon: 'category', label: 'Category', value: this.toTitle(campaign.category || 'Not set') },
      { icon: 'campaign', label: 'Campaign type', value: this.toTitle(campaign.campaignType || 'Campaign') },
      { icon: 'hub', label: 'Payout model', value: this.getPayoutModelLabel(campaign) },
      { icon: 'ads_click', label: 'Cost per click', value: this.formatCurrency(this.campaignCostPerClick(), campaign.currency) },
      { icon: 'calendar_today', label: 'Starts', value: this.formatDate(campaign.startDate) },
      { icon: 'event_busy', label: 'Ends', value: campaign.endDate ? this.formatDate(campaign.endDate) : 'Ongoing' },
    ];
  });

  protected readonly campaignHealthLabel = computed(() => {
    const progress = this.budgetProgress();
    if (progress >= 90) {
      return 'Budget almost exhausted';
    }

    if (this.invalidClicks() > this.billableClicks() && this.totalClicks() > 0) {
      return 'Click quality needs review';
    }

    if (!this.activePromotionCount()) {
      return 'Waiting for active promoters';
    }

    return 'Campaign is trackable';
  });

  protected readonly topPromotion = computed<PromotionInterface | null>(() => {
    const promotions = [...(this.campaign()?.promotions || [])];
    if (!promotions.length) {
      return null;
    }

    return promotions.sort((a, b) => this.getPromotionBillableClicks(b) - this.getPromotionBillableClicks(a))[0] || null;
  });

  protected readonly targetLocations = computed(() => this.campaign()?.targetLocations || []);
  protected readonly campaignTags = computed(() => this.campaign()?.tags || []);
  protected readonly campaignRequirements = computed(() => this.campaign()?.requirements || []);
  protected readonly campaignActivityLog = computed(() => this.campaign()?.activityLog || []);

  protected promotionTrackBy(_: number, promotion: PromotionInterface): string {
    return promotion._id;
  }

  protected isStatusSelected(status: string): boolean {
    return this.selectedStatusFilter() === status;
  }

  protected formatCompactNumber(value: number): string {
    return new Intl.NumberFormat('en', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(Number(value || 0));
  }

  protected toTitle(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  protected formatDate(value: unknown): string {
    if (!value) {
      return 'Not set';
    }

    return new Intl.DateTimeFormat('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value as string | number | Date));
  }

  protected getPromoterName(promotion: PromotionInterface): string {
    return promotion.promoter?.displayName || promotion.promoter?.username || 'Unknown promoter';
  }
}
