import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { AboutComponent } from './about.component';
import { AboutMobileComponent } from './mobile/about-mobile.component';

@Component({
  selector: 'app-about-index',
  standalone: true,
  imports: [CommonModule, AboutComponent, AboutMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-about-mobile />
    } @else {
      <app-about />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
