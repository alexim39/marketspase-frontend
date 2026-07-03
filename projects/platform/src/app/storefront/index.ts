import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { StorefrontComponent } from './storefront.component';
import { MobileStorefrontComponent } from './mobile/storefront-mobile.component';

@Component({
  selector: 'app-storefront-index',
  standalone: true,
  imports: [CommonModule, StorefrontComponent, MobileStorefrontComponent],
  template: `
    @if (isMobileExperience()) {
      <app-mobile-storefront />
    } @else {
      <app-storefront />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StorefrontIndexComponent {
  private readonly deviceService = inject(DeviceService);
  readonly deviceType = computed(() => this.deviceService.type());
  readonly isMobileExperience = computed(() => {
    const type = this.deviceType();
    return type === 'mobile' || type === 'tablet';
  });
}
