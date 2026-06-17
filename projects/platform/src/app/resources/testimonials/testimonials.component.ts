import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../core/footer/footer.component';
import { HeaderComponent } from '../core/header/header.component';
import {
  PUBLIC_TESTIMONIALS,
  TESTIMONIAL_CATEGORIES,
  TESTIMONIAL_STATS,
  PublicTestimonial,
  TestimonialAudience,
} from './testimonial-data';

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsComponent {
  readonly categories = TESTIMONIAL_CATEGORIES;
  readonly stats = TESTIMONIAL_STATS;
  readonly selectedAudience = signal<TestimonialAudience>('all');
  readonly featured = signal<PublicTestimonial>(PUBLIC_TESTIMONIALS[0]);

  readonly testimonials = computed(() => {
    const audience = this.selectedAudience();
    return audience === 'all'
      ? PUBLIC_TESTIMONIALS
      : PUBLIC_TESTIMONIALS.filter((testimonial) => testimonial.audience === audience);
  });

  selectAudience(audience: TestimonialAudience): void {
    this.selectedAudience.set(audience);
    const nextFeatured = PUBLIC_TESTIMONIALS.find((testimonial) => audience === 'all' || testimonial.audience === audience);
    if (nextFeatured) {
      this.featured.set(nextFeatured);
    }
  }

  stars(rating: number): number[] {
    return Array.from({ length: rating }, (_, index) => index);
  }
}
