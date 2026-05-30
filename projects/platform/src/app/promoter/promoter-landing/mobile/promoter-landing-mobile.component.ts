import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CampaignInterface } from '@shared/services';
import { PromoterLandingComponent } from '../promoter-landing.component';
import { PromoterLandingService } from '../promoter-landing.service';
import { CampaignCardMobileComponent } from '../components/campaign-card/mobile/campaign-card-mobile.component';
import { CampaignFiltersMobileComponent } from '../components/campaign-filters/mobile/campaign-filters-mobile.component';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { LoadingStateMobileComponent } from '../components/loading-state/mobile/loading-state-mobile.component';
import { PromoterQuickStatsMobileComponent } from '../components/promoter-quick-stats/mobile/promoter-quick-stats-mobile.component';

@Component({
  selector: 'promoter-landing-mobile',
  standalone: true,
  providers: [PromoterLandingService],
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CampaignCardMobileComponent,
    CampaignFiltersMobileComponent,
    EmptyStateComponent,
    LoadingStateMobileComponent,
    PromoterQuickStatsMobileComponent,
  ],
  templateUrl: './promoter-landing-mobile.component.html',
  styleUrls: ['./promoter-landing-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterLandingMobileComponent extends PromoterLandingComponent {
  campaignTrack(index: number, campaign: CampaignInterface): string {
    return campaign._id || String(index);
  }
}
