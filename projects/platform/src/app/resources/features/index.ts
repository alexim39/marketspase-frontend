import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { FeaturesComponent } from './features.component';
import { FeaturesMobileComponent } from './mobile/features-mobile.component';

@Component({
  selector: 'app-features-index',
  standalone: true,
  imports: [CommonModule, FeaturesComponent, FeaturesMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-features-mobile />
    } @else {
      <app-features />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
