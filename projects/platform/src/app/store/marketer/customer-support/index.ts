import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { CustomerSupportComponent } from './customer-support.component';
import { CustomerSupportMobileComponent } from './mobile/customer-support-mobile.component';

@Component({
  selector: 'app-customer-support-route',
  standalone: true,
  imports: [CommonModule, CustomerSupportComponent, CustomerSupportMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-customer-support-mobile />
    } @else {
      <app-customer-support />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerSupportIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
