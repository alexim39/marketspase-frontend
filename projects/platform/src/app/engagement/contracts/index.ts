import { Component, inject, computed } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { EngagementContractsComponent } from './engagement-contracts.component';
import { EngagementContractsMobileComponent } from './mobile/engagement-contracts-mobile.component';

@Component({
  selector: 'app-engagement-contracts-index',
  standalone: true,
  imports: [EngagementContractsComponent, EngagementContractsMobileComponent],
  template: `
    @if (isMobile()) {
      <app-engagement-contracts-mobile />
    } @else {
      <app-engagement-contracts />
    }
  `
})
export class EngagementContractsIndexComponent {
  private device = inject(DeviceService);
  isMobile = computed(() => this.device.type() === 'mobile' || this.device.type() === 'tablet');
}
