import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { WithdrawalComponent } from './withdrawal.component';
import { WithdrawalMobileComponent } from './mobile/withdrawal-mobile.component';

@Component({
  selector: 'app-withdrawal-index',
  standalone: true,
  imports: [CommonModule, WithdrawalComponent, WithdrawalMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <async-withdrawal-mobile />
    } @else {
      <async-withdrawal />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithdrawalIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
