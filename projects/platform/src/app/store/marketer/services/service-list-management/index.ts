import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { ServiceListManagementComponent } from '../service-list-management/service-list-management.component';
import { ServiceListManagementMobileComponent } from '../service-list-management/mobile/service-list-management-mobile.component';

@Component({
  selector: 'app-service-list-index',
  standalone: true,
  imports: [CommonModule, ServiceListManagementComponent, ServiceListManagementMobileComponent],
  template: `@if (isMobile()) { <app-service-list-mobile /> } @else { <app-service-list-management /> }`,
})
export class ServiceListIndexComponent {
  private ds = inject(DeviceService);
  isMobile = computed(() => this.ds.type() === 'mobile' || this.ds.type() === 'tablet');
}
