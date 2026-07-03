import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { SupportMobileComponent } from './mobile/support-mobile.component';
import { SupportComponent } from './support.component';

@Component({
  selector: 'async-support-setting-index',
  standalone: true,
  imports: [CommonModule, SupportComponent, SupportMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <async-support-mobile />
    } @else {
      <async-review-setting />
    }
  `,
})
export class SupportIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
