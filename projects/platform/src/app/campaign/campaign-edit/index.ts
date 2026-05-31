import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { CampaignEditComponent } from './campaign-edit.component';
import { CampaignEditMobileComponent } from './mobile/campaign-edit-mobile.component';

@Component({
  selector: 'app-campaign-edit-index',
  standalone: true,
  imports: [CommonModule, CampaignEditComponent, CampaignEditMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-campaign-edit-mobile />
    } @else {
      <app-campaign-edit />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignEditIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
