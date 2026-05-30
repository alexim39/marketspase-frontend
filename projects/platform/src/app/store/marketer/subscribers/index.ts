import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services';
import { StoreEmailSubscribersComponent } from './store-subscribers.component';
import { StoreEmailSubscribersMobileComponent } from './mobile/store-subscribers-mobile.component';

@Component({
  selector: 'app-store-email-subscribers-index',
  standalone: true,
  imports: [CommonModule, StoreEmailSubscribersComponent, StoreEmailSubscribersMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-store-email-subscribers-mobile />
    } @else {
      <app-store-email-subscribers />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreEmailSubscribersIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
