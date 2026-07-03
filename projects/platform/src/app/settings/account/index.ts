import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { AccountComponent } from './account.component';
import { AccountMobileComponent } from './mobile/account-mobile.component';

@Component({
  selector: 'async-account-index',
  standalone: true,
  imports: [CommonModule, AccountComponent, AccountMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <async-account-mobile />
    } @else {
      <async-account />
    }
  `,
})
export class AccountIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
