import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { ForumMobileComponent } from './mobile/forum-mobile.component';
import { ForumPageComponent } from './forum-page.component';

@Component({
  selector: 'app-forum-index',
  standalone: true,
  imports: [CommonModule, ForumPageComponent, ForumMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-forum-mobile />
    } @else {
      <app-forum-page />
    }
  `,
})
export class ForumIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
