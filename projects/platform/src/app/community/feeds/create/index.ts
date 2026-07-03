import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { CreateFeedPageComponent } from './create-feed.component';
import { CreateFeedMobileComponent } from './mobile/create-feed-mobile.component';

@Component({
  selector: 'app-create-feed-index',
  standalone: true,
  imports: [CommonModule, CreateFeedPageComponent, CreateFeedMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-create-feed-mobile />
    } @else {
      <app-create-feed-page />
    }
  `,
})
export class CreateFeedIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
