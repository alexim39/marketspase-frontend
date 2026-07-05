import { Component, inject, computed } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { PromoterEngagementFeedComponent } from './promoter-engagement-feed.component';
import { PromoterEngagementFeedMobileComponent } from './mobile/promoter-engagement-feed-mobile.component';

@Component({
  selector: 'app-promoter-engagement-feed-index',
  standalone: true,
  imports: [PromoterEngagementFeedComponent, PromoterEngagementFeedMobileComponent],
  template: `
    @if (isMobile()) {
      <app-promoter-engagement-feed-mobile />
    } @else {
      <app-promoter-engagement-feed />
    }
  `
})
export class PromoterEngagementFeedIndexComponent {
  private device = inject(DeviceService);
  isMobile = computed(() => this.device.type() === 'mobile' || this.device.type() === 'tablet');
}
