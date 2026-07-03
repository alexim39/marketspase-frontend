import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { StorefrontCartComponent } from './storefront-cart.component';
import { MobileStorefrontCartComponent } from './mobile/storefront-cart-mobile.component';

@Component({
  selector: 'app-storefront-cart-index',
  standalone: true,
  imports: [CommonModule, StorefrontCartComponent, MobileStorefrontCartComponent],
  template: `
    @if (deviceType() === 'mobile' || deviceType() === 'tablet') {
      <app-mobile-storefront-cart />
    } @else {
      <app-storefront-cart />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontCartIndexComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly deviceType = computed(() => this.deviceService.type());
}
