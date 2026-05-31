import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { ThreadDetailMobileComponent } from './mobile/thread-detail-mobile.component';
import { ThreadDetailComponent } from './thread-detail.component';

@Component({
  selector: 'app-thread-detail-index',
  standalone: true,
  imports: [CommonModule, ThreadDetailComponent, ThreadDetailMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-thread-detail-mobile />
    } @else {
      <app-thread-detail />
    }
  `,
})
export class ThreadDetailIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
