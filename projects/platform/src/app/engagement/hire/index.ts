import { Component, inject, computed } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { HirePromotersComponent } from './hire-promoters.component';
import { HirePromotersMobileComponent } from './mobile/hire-promoters-mobile/hire-promoters-mobile.component';

@Component({
  selector: 'app-hire-promoters-index',
  standalone: true,
  imports: [HirePromotersComponent, HirePromotersMobileComponent],
  template: `
    @if (isMobile()) {
      <app-hire-promoters-mobile />
    } @else {
      <app-hire-promoters />
    }
  `
})
export class HirePromotersIndexComponent {
  private device = inject(DeviceService);
  isMobile = computed(() => this.device.type() === 'mobile' || this.device.type() === 'tablet');
}
