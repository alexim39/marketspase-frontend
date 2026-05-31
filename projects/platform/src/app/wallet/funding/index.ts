import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { WalletFundingComponent } from './funding.component';
import { WalletFundingMobileComponent } from './mobile/wallet-funding-mobile.component';

@Component({
  selector: 'wallet-funding-index',
  standalone: true,
  imports: [WalletFundingComponent, WalletFundingMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <wallet-funding-mobile />
    } @else {
      <wallet-funding />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WalletFundingIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const type = this.deviceService.type();
    return type === 'mobile' || type === 'tablet';
  });
}
