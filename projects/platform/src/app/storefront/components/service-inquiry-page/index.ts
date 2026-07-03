import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { ServiceInquiryPageComponent } from './service-inquiry-page.component';
import { ServiceInquiryMobileComponent } from './mobile/service-inquiry-mobile.component';

@Component({
  selector: 'app-service-inquiry-page-index',
  standalone: true,
  imports: [CommonModule, ServiceInquiryPageComponent, ServiceInquiryMobileComponent],
  template: `
    @if (isMobile()) {
      <app-service-inquiry-mobile />
    } @else {
      <app-service-inquiry-page />
    }
  `,
})
export class ServiceInquiryPageIndexComponent {
  private ds = inject(DeviceService);
  isMobile = computed(() => this.ds.type() === 'mobile' || this.ds.type() === 'tablet');
}
