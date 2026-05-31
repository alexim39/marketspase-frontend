import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PublicCampaignUnavailableComponent } from '../desktop/public-campaign-unavailable.component';

type ReasonTone = 'neutral' | 'warning' | 'danger' | 'review';

@Component({
  selector: 'app-public-campaign-unavailable-mobile',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './public-campaign-unavailable-mobile.component.html',
  styleUrl: './public-campaign-unavailable-mobile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicCampaignUnavailableMobileComponent extends PublicCampaignUnavailableComponent {
  readonly reasonLabel = computed(() => {
    switch (this.reason()) {
      case 'exhausted':
        return 'Budget reached';
      case 'expired':
        return 'Campaign ended';
      case 'paused':
        return 'Paused by advertiser';
      case 'under_review':
        return 'Under MarketSpase review';
      case 'rejected':
      case 'campaign_removed':
        return 'Campaign removed';
      case 'invalid_link':
        return 'Invalid promotion link';
      default:
        return 'Unavailable';
    }
  });

  readonly reasonIcon = computed(() => {
    switch (this.reason()) {
      case 'exhausted':
        return 'account_balance_wallet';
      case 'expired':
        return 'event_busy';
      case 'paused':
        return 'pause_circle';
      case 'under_review':
        return 'policy';
      case 'invalid_link':
        return 'link_off';
      default:
        return 'campaign';
    }
  });

  readonly reasonTone = computed<ReasonTone>(() => {
    switch (this.reason()) {
      case 'under_review':
        return 'review';
      case 'expired':
      case 'paused':
      case 'exhausted':
        return 'warning';
      case 'invalid_link':
      case 'rejected':
      case 'campaign_removed':
        return 'danger';
      default:
        return 'neutral';
    }
  });

  readonly nextSteps = [
    'MarketSpase has stopped billing clicks on this old promotion link.',
    'The link is safely redirected here instead of failing in the browser.',
    'You can continue with active campaigns, storefront products, or seller support.',
  ];
}
