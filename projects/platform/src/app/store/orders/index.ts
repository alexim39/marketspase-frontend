import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { StorefrontOrdersComponent } from './storefront-orders.component';
import { MobileStorefrontOrdersComponent } from './mobile/index.component';

@Component({
  selector: 'app-storefront-orders-index',
  standalone: true,
  imports: [CommonModule, StorefrontOrdersComponent, MobileStorefrontOrdersComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (deviceType() === 'mobile') {
      <app-mobile-storefront-orders />
    }

    @if (deviceType() === 'tablet') {
      <app-mobile-storefront-orders />
    }

    @if (deviceType() === 'desktop') {
      <app-storefront-orders />
    }
  `,
})
export class StorefrontOrdersIndexComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly deviceType = computed(() => this.deviceService.type());
}
