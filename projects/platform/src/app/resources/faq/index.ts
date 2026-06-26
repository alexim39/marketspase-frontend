import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services/device';
import { FAQComponent } from './faq.component';
import { FAQMobileComponent } from './mobile/faq-mobile.component';

@Component({
  selector: 'app-faq-index',
  standalone: true,
  imports: [CommonModule, FAQComponent, FAQMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-faq-mobile />
    } @else {
      <app-faq />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FAQIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
