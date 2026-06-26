import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { CreateCampaignComponent } from './create-campaign.component';
import { CreateCampaignMobileComponent } from './mobile/create-campaign-mobile.component';

@Component({
  selector: 'app-create-campaign-index',
  standalone: true,
  imports: [CommonModule, CreateCampaignComponent, CreateCampaignMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-create-campaign-mobile />
    } @else {
      <app-create-campaign />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateCampaignIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
