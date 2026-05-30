import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { NotificationCenterComponent } from './notification-center.component';
import { MobileNotificationCenterComponent } from './mobile/index.component';

@Component({
  selector: 'app-notification-center-index',
  standalone: true,
  imports: [CommonModule, NotificationCenterComponent, MobileNotificationCenterComponent],
  template: `
    @if (deviceType() === 'mobile' || deviceType() === 'tablet') {
      <app-mobile-notification-center />
    } @else {
      <app-notification-center />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterIndexComponent {
  private readonly deviceService = inject(DeviceService);

  readonly deviceType = computed(() => this.deviceService.type());
}
