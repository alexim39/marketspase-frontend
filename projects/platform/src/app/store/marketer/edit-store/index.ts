import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { StoreEditComponent } from './store-edit.component';
import { StoreEditMobileComponent } from './mobile/store-edit-mobile.component';

@Component({
  selector: 'app-store-edit-route',
  standalone: true,
  imports: [CommonModule, StoreEditComponent, StoreEditMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-store-edit-mobile />
    } @else {
      <app-store-edit />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreEditIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
