import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { EditProductComponent } from './edit-product.component';
import { EditProductMobileComponent } from './mobile/edit-product-mobile.component';

@Component({
  selector: 'app-edit-product-route',
  standalone: true,
  imports: [CommonModule, EditProductComponent, EditProductMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-edit-product-mobile />
    } @else {
      <app-edit-product />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProductIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
