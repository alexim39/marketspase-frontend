import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { StoreCreateComponent } from './store-create.component';
import { StoreCreateMobileComponent } from './mobile/store-create-mobile.component';

@Component({
  selector: 'app-store-create-route',
  standalone: true,
  imports: [CommonModule, StoreCreateComponent, StoreCreateMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-store-create-mobile />
    } @else {
      <app-store-create />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreCreateIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
