import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { ProductDetailsComponent } from './product-details.component';
import { MobileProductDetailsComponent } from './mobile/product-details-mobile.component';

@Component({
  selector: 'app-product-details-index',
  standalone: true,
  imports: [CommonModule, ProductDetailsComponent, MobileProductDetailsComponent],
  template: `
    @if (deviceType() === 'mobile' || deviceType() === 'tablet') {
      <app-mobile-product-details />
    } @else {
      <app-product-details />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly deviceType = computed(() => this.deviceService.type());
}
