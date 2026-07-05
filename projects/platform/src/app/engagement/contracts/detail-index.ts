import { Component, inject, computed } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { EngagementContractDetailComponent } from './contract-detail.component';
import { EngagementContractDetailMobileComponent } from './mobile/contract-detail-mobile.component';

@Component({
  selector: 'app-contract-detail-index',
  standalone: true,
  imports: [EngagementContractDetailComponent, EngagementContractDetailMobileComponent],
  template: `
    @if (isMobile()) {
      <app-contract-detail-mobile />
    } @else {
      <app-contract-detail />
    }
  `
})
export class EngagementContractDetailIndexComponent {
  private device = inject(DeviceService);
  isMobile = computed(() => this.device.type() === 'mobile' || this.device.type() === 'tablet');
}
