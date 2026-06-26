import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { DesktopPromotedProductsComponent } from './desktop/desktop-promoted-products.component';
import { MobilePromotedProductsComponent } from './mobile/mobile-promoted-products.component';

@Component({
  selector: 'promotions-index',
  standalone: true,
  imports: [CommonModule, DesktopPromotedProductsComponent, MobilePromotedProductsComponent],
  template: `
    @if (deviceType() === 'mobile') {
      <app-mobile-promoted-products />
    } @else if (deviceType() === 'tablet') {
      <app-mobile-promoted-products />
    } @else {
      <app-desktop-promoted-products />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PromotionsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly deviceType = computed(() => this.deviceService.type());
}
