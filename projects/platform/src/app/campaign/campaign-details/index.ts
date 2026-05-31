import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { CampaignDetailsComponent } from './campaign-details.component';
import { CampaignDetailsMobileComponent } from './mobile/campaign-details-mobile.component';

@Component({
  selector: 'app-campaign-details-index',
  standalone: true,
  imports: [CommonModule, CampaignDetailsComponent, CampaignDetailsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-campaign-details-mobile />
    } @else {
      <app-campaign-details />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignDetailsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
