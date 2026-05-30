import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { CampaignAnalyticsComponent } from './campaign-analytics.component';
import { CampaignAnalyticsMobileComponent } from './mobile/campaign-analytics-mobile.component';

@Component({
  selector: 'app-campaign-analytics-index',
  standalone: true,
  imports: [CommonModule, CampaignAnalyticsComponent, CampaignAnalyticsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-campaign-analytics-mobile />
    } @else {
      <app-campaign-analytics />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignAnalyticsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
