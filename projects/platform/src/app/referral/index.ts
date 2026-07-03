import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { ReferralCaptureMobileComponent } from './mobile/referral-capture-mobile.component';
import { ReferralCaptureComponent } from './referral-capture.component';

@Component({
  selector: 'app-referral-capture-index',
  standalone: true,
  imports: [CommonModule, ReferralCaptureComponent, ReferralCaptureMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-referral-capture-mobile />
    } @else {
      <async-referral-capture />
    }
  `,
})
export class ReferralCaptureIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
