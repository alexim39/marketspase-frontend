import { Component, inject, computed, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { DesktopPromotedProductsComponent } from './desktop/desktop-promoted-products.component';
import { MobilePromotedProductsComponent } from './mobile/mobile-promoted-products.component';

@Component({
  selector: 'promotions-index',
  standalone: true,
  imports: [CommonModule, DesktopPromotedProductsComponent, MobilePromotedProductsComponent  ],
  template: `
    <!-- Mobile Notice (Optional) -->
    @if (deviceType() === 'mobile') {
      <app-mobile-promoted-products />
    }
    
    <!-- Tablet Notice (Optional) -->
    @if (deviceType() === 'tablet') {
      <app-desktop-promoted-products />
    }

    <!-- Desktop Notice (Optional) -->
    @if (deviceType() === 'desktop') {
      <app-desktop-promoted-products />
    }
  `,
})
export class PromotionsIndexComponent {
  private readonly deviceService = inject(DeviceService);
  // Computed properties for better performance
  protected readonly deviceType = computed(() => this.deviceService.type());
}
