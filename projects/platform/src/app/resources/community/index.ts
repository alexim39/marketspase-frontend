import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { CommunityComponent } from './community.component';
import { CommunityMobileComponent } from './mobile/community-mobile.component';

@Component({
  selector: 'app-community-index',
  standalone: true,
  imports: [CommonModule, CommunityComponent, CommunityMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-community-mobile />
    } @else {
      <app-community />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
