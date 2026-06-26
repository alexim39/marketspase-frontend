import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { PublicCampaignDesktopComponent } from './public-campaign-desktop.component';
import { PublicCampaignMobileComponent } from './public-campaign-mobile.component';

@Component({
  selector: 'app-public-campaign-index',
  standalone: true,
  imports: [CommonModule, PublicCampaignDesktopComponent, PublicCampaignMobileComponent],
  template: `
    @if (isMobile()) {
      <app-public-campaign-mobile />
    } @else {
      <app-public-campaign-desktop />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicCampaignIndexComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly isMobile = computed(() => {
    const t = this.deviceService.type();
    return t === 'mobile' || t === 'tablet';
  });
}
