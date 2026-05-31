import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { TermsMobileComponent } from './mobile/terms-mobile.component';
import { TermsComponent } from './terms.component';

@Component({
  selector: 'app-terms-index',
  standalone: true,
  imports: [CommonModule, TermsComponent, TermsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-terms-mobile />
    } @else {
      <async-terms />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
