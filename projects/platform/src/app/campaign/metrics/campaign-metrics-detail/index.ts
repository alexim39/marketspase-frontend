import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { CampaignMetricsDetailComponent } from './campaign-metrics-detail.component';
import { CampaignMetricsDetailMobileComponent } from './mobile/campaign-metrics-detail-mobile.component';

@Component({
  selector: 'app-campaign-metrics-detail-index',
  standalone: true,
  imports: [CommonModule, CampaignMetricsDetailComponent, CampaignMetricsDetailMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-campaign-metrics-detail-mobile />
    } @else {
      <app-campaign-metrics-detail />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignMetricsDetailIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
