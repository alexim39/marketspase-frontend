import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { PublicFeedPostComponent } from '../public-feed-post.component';
import { PublicFeedPostMobileComponent } from './mobile/public-feed-post-mobile.component';

@Component({
  selector: 'app-public-feed-post-index',
  standalone: true,
  imports: [CommonModule, PublicFeedPostComponent, PublicFeedPostMobileComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isMobileExperience()) {
      <app-public-feed-post-mobile />
    } @else {
      <app-public-feed-post />
    }
  `,
})
export class PublicFeedPostIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
