import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '@shared/services/device';
import { PromoterDiscoveryComponent } from './promoter-discovery.component';

@Component({
  selector: 'app-promoter-discovery-route',
  standalone: true,
  imports: [CommonModule, PromoterDiscoveryComponent],
  template: `
    @if (isMobileExperience()) {
      <app-promoter-discovery />
    } @else {
      <app-promoter-discovery />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromoterDiscoveryIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
