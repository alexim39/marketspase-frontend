import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { PublicCampaignUnavailableComponent } from './desktop/public-campaign-unavailable.component';
import { PublicCampaignUnavailableMobileComponent } from './mobile/public-campaign-unavailable-mobile.component';

@Component({
  selector: 'app-public-campaign-unavailable-index',
  standalone: true,
  imports: [
    CommonModule,
    PublicCampaignUnavailableComponent,
    PublicCampaignUnavailableMobileComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-public-campaign-unavailable-mobile />
    } @else {
      <app-public-campaign-unavailable />
    }
  `,
})
export class PublicCampaignUnavailableIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
