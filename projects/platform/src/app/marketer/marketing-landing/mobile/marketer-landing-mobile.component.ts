import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CampaignInterface, CurrencyUtilsPipe } from '@shared/services';
import { CampaignCardMobileComponent } from '../components/campaign-card/mobile/campaign-card-mobile.component';
import { CampaignSkeletonComponent } from '../components/campaign-skeleton/campaign-skeleton.component';
import { CampaignDetailsService } from '../../../campaign/campaign-details/campaign-details.service';
import { MarketerService } from '../../marketer.service';
import { MarketerLandingComponent } from '../marketer-landing.component';

@Component({
  selector: 'marketer-landing-mobile',
  standalone: true,
  providers: [MarketerService, CampaignDetailsService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CampaignCardMobileComponent,
    CampaignSkeletonComponent,
    CurrencyUtilsPipe,
    TitleCasePipe,
  ],
  templateUrl: './marketer-landing-mobile.component.html',
  styleUrls: ['./marketer-landing-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketerLandingMobileComponent extends MarketerLandingComponent {
  readonly mobileSortOptions = [
    { label: 'Newest', icon: 'schedule', sortBy: 'createdAt', sortOrder: 'desc' as const },
    { label: 'Budget', icon: 'account_balance_wallet', sortBy: 'budget', sortOrder: 'desc' as const },
    { label: 'Spend', icon: 'trending_up', sortBy: 'spentBudget', sortOrder: 'desc' as const },
  ];

  setMobileSearch(value: string): void {
    this.searchControl.setValue(value);
  }

  setStatus(status: string): void {
    this.updateFilters({ status });
  }

  setSort(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    this.updateFilters({ sortBy, sortOrder });
  }

  isSortActive(sortBy: string): boolean {
    return this.currentFilters().sortBy === sortBy;
  }

  campaignTrack(index: number, campaign: CampaignInterface): string {
    return campaign._id || String(index);
  }
}
