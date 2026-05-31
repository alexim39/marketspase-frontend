import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { CampaignCollaborationComponent } from './collaboration.component';
import { CampaignCollaborationMobileComponent } from './mobile/campaign-collaboration-mobile.component';

@Component({
  selector: 'app-campaign-collaboration-index',
  standalone: true,
  imports: [CommonModule, CampaignCollaborationComponent, CampaignCollaborationMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-campaign-collaboration-mobile />
    } @else {
      <app-campaign-collaboration />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignCollaborationIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
