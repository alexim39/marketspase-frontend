import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeviceService } from '@shared/services';
import { TestimonialsMobileComponent } from './mobile/testimonials-mobile.component';
import { TestimonialsComponent } from './testimonials.component';

@Component({
  selector: 'app-testimonials-index',
  standalone: true,
  imports: [CommonModule, TestimonialsComponent, TestimonialsMobileComponent],
  template: `
    @if (isMobileExperience()) {
      <app-testimonials-mobile />
    } @else {
      <app-testimonials />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsIndexComponent {
  private readonly deviceService = inject(DeviceService);

  protected readonly isMobileExperience = computed(() => {
    const deviceType = this.deviceService.type();
    return deviceType === 'mobile' || deviceType === 'tablet';
  });
}
