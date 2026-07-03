import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { SystemSettingComponent } from './system.component';
import { SystemSettingMobileComponent } from './mobile/system-setting-mobile.component';

@Component({
  selector: 'async-system-setting-index',
  standalone: true,
  imports: [CommonModule, SystemSettingComponent, SystemSettingMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <async-system-setting-mobile />
    } @else {
      <async-system-setting />
    }
  `,
})
export class SystemSettingIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
