import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DeviceService } from '@shared/services/device';
import { OverviewComponent } from './overview.component';
import { OverviewMobileComponent } from './mobile/overview-mobile.component';

@Component({
  selector: 'app-overview-index',
  standalone: true,
  imports: [CommonModule, OverviewComponent, OverviewMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-overview-mobile />
    } @else {
      <app-overview />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceType = computed(() => this.deviceService.type());

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
