import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { PrivacyMobileComponent } from './mobile/privacy-mobile.component';
import { PrivacyComponent } from './privacy.component';

@Component({
  selector: 'app-privacy-index',
  standalone: true,
  imports: [CommonModule, PrivacyComponent, PrivacyMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-privacy-mobile />
    } @else {
      <async-privacy />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
