import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { AdsPreferenceSettingsComponent } from './ads-preference.component';
import { AdsPreferenceMobileComponent } from './mobile/ads-preference-mobile.component';

@Component({
  selector: 'async-ads-preference-index',
  standalone: true,
  imports: [CommonModule, AdsPreferenceSettingsComponent, AdsPreferenceMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <async-ads-preference-mobile />
    } @else {
      <async-ads-preference />
    }
  `,
})
export class AdsPreferenceIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
