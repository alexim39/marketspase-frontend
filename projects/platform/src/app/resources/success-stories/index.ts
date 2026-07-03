import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { SuccessStoriesMobileComponent } from './mobile/success-stories-mobile.component';
import { SuccessStoriesComponent } from './success-stories.component';

@Component({
  selector: 'app-success-stories-index',
  standalone: true,
  imports: [CommonModule, SuccessStoriesComponent, SuccessStoriesMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-success-stories-mobile />
    } @else {
      <app-success-stories />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessStoriesIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
