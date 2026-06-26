import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { GlobalSearchPageComponent } from './global-search-page.component';
import { GlobalSearchMobileComponent } from './mobile/global-search-mobile.component';

@Component({
  selector: 'app-global-search-index',
  standalone: true,
  imports: [CommonModule, GlobalSearchPageComponent, GlobalSearchMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-global-search-mobile />
    } @else {
      <app-global-search-page />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchIndexComponent {
  private readonly deviceService = inject(DeviceService);
  private readonly deviceType = computed(() => this.deviceService.type());

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceType();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
