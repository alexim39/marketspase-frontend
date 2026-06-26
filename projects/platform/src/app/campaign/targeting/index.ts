import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { CampaignTargetingComponent } from './targeting.component';
import { CampaignTargetingMobileComponent } from './mobile/campaign-targeting-mobile.component';

@Component({
  selector: 'app-campaign-targeting-index',
  standalone: true,
  imports: [CommonModule, CampaignTargetingComponent, CampaignTargetingMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-campaign-targeting-mobile />
    } @else {
      <app-campaign-targeting />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignTargetingIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
