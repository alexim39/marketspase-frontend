import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../core/footer/footer.component';
import { HeaderComponent } from '../../core/header/header.component';
import {
  PUBLIC_TESTIMONIALS,
  TESTIMONIAL_CATEGORIES,
  TESTIMONIAL_STATS,
  TestimonialAudience,
} from '../testimonial-data';

@Component({
  selector: 'app-testimonials-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './testimonials-mobile.component.html',
  styleUrls: ['./testimonials-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsMobileComponent {
  readonly categories = TESTIMONIAL_CATEGORIES;
  readonly stats = TESTIMONIAL_STATS;
  readonly selectedAudience = signal<TestimonialAudience>('all');

  readonly testimonials = computed(() => {
    const audience = this.selectedAudience();
    return audience === 'all'
      ? PUBLIC_TESTIMONIALS
      : PUBLIC_TESTIMONIALS.filter((testimonial) => testimonial.audience === audience);
  });

  readonly featured = computed(() => this.testimonials()[0] ?? PUBLIC_TESTIMONIALS[0]);

  selectAudience(audience: TestimonialAudience): void {
    this.selectedAudience.set(audience);
  }

  stars(rating: number): number[] {
    return Array.from({ length: rating }, (_, index) => index);
  }
}
