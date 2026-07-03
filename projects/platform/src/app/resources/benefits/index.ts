import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { BenefitsComponent } from './benefits.component';
import { BenefitsMobileComponent } from './mobile/benefits-mobile.component';

@Component({
  selector: 'app-benefits-index',
  standalone: true,
  imports: [CommonModule, BenefitsComponent, BenefitsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-benefits-mobile />
    } @else {
      <app-benefit />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BenefitsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
