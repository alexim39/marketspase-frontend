import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { CreateServiceComponent } from '../create-service/create-service.component';
import { CreateServiceMobileComponent } from '../create-service/mobile/create-service-mobile.component';

@Component({
  selector: 'app-create-service-index',
  standalone: true,
  imports: [CommonModule, CreateServiceComponent, CreateServiceMobileComponent],
  template: `@if (isMobile()) { <app-create-service-mobile /> } @else { <app-create-service /> }`,
})
export class CreateServiceIndexComponent {
  private ds = inject(DeviceService);
  isMobile = computed(() => this.ds.type() === 'mobile' || this.ds.type() === 'tablet');
}
