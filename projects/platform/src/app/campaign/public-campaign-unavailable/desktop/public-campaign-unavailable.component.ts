import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

type UnavailableReason =
  | 'invalid_link'
  | 'campaign_removed'
  | 'inactive'
  | 'paused'
  | 'exhausted'
  | 'expired'
  | 'rejected'
  | 'under_review'
  | string;

@Component({
  selector: 'app-public-campaign-unavailable',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './public-campaign-unavailable.component.html',
  styleUrls: ['./public-campaign-unavailable.component.scss'],
})
export class PublicCampaignUnavailableComponent {
  private readonly route = inject(ActivatedRoute);

  readonly title = computed(() => this.route.snapshot.queryParamMap.get('title') || 'Campaign no longer available');
  readonly reason = computed<UnavailableReason>(() => this.route.snapshot.queryParamMap.get('reason') || 'inactive');
  readonly contactUrl = computed(() => {
    const value = this.route.snapshot.queryParamMap.get('contactUrl') || '';
    return /^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(value) ? value : '';
  });

  readonly headline = computed(() => {
    switch (this.reason()) {
      case 'exhausted':
        return 'This campaign has reached its budget.';
      case 'expired':
        return 'This campaign has ended.';
      case 'paused':
        return 'This campaign is temporarily paused.';
      case 'under_review':
        return 'This campaign link is temporarily unavailable.';
      default:
        return 'This campaign is no longer available.';
    }
  });

  readonly body = computed(() => {
    switch (this.reason()) {
      case 'exhausted':
        return 'The advertiser has used the current campaign budget, so this promotion link is no longer accepting traffic.';
      case 'expired':
        return 'The scheduled run for this campaign has ended, so this promotion is no longer active.';
      case 'paused':
        return 'The advertiser or MarketSpase has paused this campaign for now. You can still explore other current offers on the platform.';
      case 'under_review':
        return 'MarketSpase is reviewing activity linked to this promotion. While that check is in progress, the link has been turned off.';
      default:
        return 'The link you opened is no longer active. We have redirected you here so you do not land on a broken or unexpected page.';
    }
  });
}
