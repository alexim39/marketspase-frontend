import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { TransferFundsComponent } from './transfer-funds.component';
import { TransferFundsMobileComponent } from './mobile/transfer-funds-mobile.component';

@Component({
  selector: 'app-transfer-funds-index',
  standalone: true,
  imports: [CommonModule, TransferFundsComponent, TransferFundsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <async-transfer-funds-mobile />
    } @else {
      <async-transfer-funds />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferFundsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
