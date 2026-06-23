import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { CampaignMetricsComponent } from './campaign-metrics.component';
import { CampaignMetricsMobileComponent } from './mobile/campaign-metrics-mobile.component';

@Component({
  selector: 'app-campaign-metrics-index',
  standalone: true,
  imports: [CommonModule, CampaignMetricsComponent, CampaignMetricsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-campaign-metrics-mobile />
    } @else {
      <app-campaign-metrics />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignMetricsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
