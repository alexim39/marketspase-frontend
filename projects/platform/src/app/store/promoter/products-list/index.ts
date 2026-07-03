import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { PromoterProductsListComponent } from './promoter-products-list.component';
import { MobilePromoterProductsListComponent } from './mobile/index.component';

@Component({
  selector: 'app-promoter-products-list-index',
  standalone: true,
  imports: [CommonModule, PromoterProductsListComponent, MobilePromoterProductsListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (deviceType() === 'mobile') {
      <app-mobile-promoter-products-list />
    }

    @if (deviceType() === 'tablet') {
      <app-mobile-promoter-products-list />
    }

    @if (deviceType() === 'desktop') {
      <app-promoter-products-list />
    }
  `,
})
export class PromoterProductsListIndexComponent {
  private readonly deviceService = inject(DeviceService);
  protected readonly deviceType = computed(() => this.deviceService.type());
}
