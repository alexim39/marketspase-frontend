import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { AddProductComponent } from './add-product.component';
import { AddProductMobileComponent } from './mobile/add-product-mobile.component';

@Component({
  selector: 'app-add-product-route',
  standalone: true,
  imports: [CommonModule, AddProductComponent, AddProductMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-add-product-mobile />
    } @else {
      <app-add-product />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddProductIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
