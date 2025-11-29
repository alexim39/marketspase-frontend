import { CommonModule } from '@angular/common';
import { 
  Component, 
  computed, 
  DestroyRef, 
  inject, 
  Input, 
  OnDestroy,
  OnInit, 
  Signal, 
  signal 
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DashboardService, TestimonialInterface } from '../dashboard.service';
import { UserInterface } from '../../../../../shared-services/src/public-api';
import { MatIconModule } from '@angular/material/icon';

interface TestimonialState {
  testimonials: TestimonialInterface[];
  currentIndex: number;
  progress: number;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
}

@Component({
  selector: 'async-dashboard-testimonials',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  providers: [DashboardService],
  template: `
    <article class="testimonials-container" [class.loading]="state().isLoading">
      <!-- Header -->
      <header class="testimonials-header">
        <h2 class="section-title">What Our Members Say</h2>
        <p class="section-subtitle">Real stories from our community</p>
      </header>

      <!-- Loading State -->
      @if (state().isLoading) {
        <div class="loading-skeleton">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line--long"></div>
            <div class="skeleton-line skeleton-line--short"></div>
            <div class="skeleton-line skeleton-line--medium"></div>
          </div>
        </div>
      }

      <!-- Error State -->
      @else if (state().error) {
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <p class="error-message">{{ state().error }}</p>
          <button class="retry-button" (click)="loadTestimonials()">
            Try Again
          </button>
        </div>
      }

      <!-- Testimonials Content -->
      @else if (hasTestimonials()) {
        <div 
          class="testimonial-carousel"
          (mouseenter)="pauseCarousel()" 
          (mouseleave)="resumeCarousel()"
          [attr.aria-live]="state().isPaused ? 'polite' : 'off'"
        >
          <!-- Previous Button -->
          <button 
            class="nav-button nav-button--prev"
            (click)="previousTestimonial()"
            [attr.aria-label]="'Previous testimonial'"
            [disabled]="testimonials().length <= 1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Testimonial Card -->
          <div class="testimonial-card" [attr.aria-label]="'Testimonial ' + (state().currentIndex + 1) + ' of ' + testimonials().length">
            <div class="card-content">
              <div class="testimonial-avatar">
                <img 
                  [src]="currentTestimonial().avatar" 
                  [alt]="currentTestimonial().name + ' avatar'"
                  class="avatar-image"
                  loading="lazy"
                />
                <div class="avatar-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <div class="testimonial-content">
                <!-- Rating display -->
                @if (currentTestimonial().rating) {
                  <div class="testimonial-rating">
                    <div class="stars">
                      @for (star of [1,2,3,4,5]; track star) {
                        <mat-icon>{{ star <= currentTestimonial().rating ? 'star' : 'star_border' }}</mat-icon>
                      }
                    </div>
                    <span class="rating-value">({{ currentTestimonial().rating }}/5)</span>
                  </div>
                }

                <blockquote class="testimonial-message">
                  "{{ currentTestimonial().message }}"
                </blockquote>
                
                <footer class="testimonial-footer">
                  <cite class="author-name">{{ currentTestimonial().name | titlecase }}</cite>
                  <span class="author-location">{{ currentTestimonial().location | titlecase }}</span>
                </footer>
              </div>
            </div>
          </div>

          <!-- Next Button -->
          <button 
            class="nav-button nav-button--next"
            (click)="nextTestimonial()"
            [attr.aria-label]="'Next testimonial'"
            [disabled]="testimonials().length <= 1"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>

        <!-- Progress Bar -->
        <div class="progress-container" [attr.aria-hidden]="true">
          <div class="progress-bar">
            <div 
              class="progress-fill"
              [style.transform]="'scaleX(' + (state().progress / 100) + ')'"
            ></div>
          </div>
          
          <!-- Testimonial Indicators -->
          <div class="testimonial-indicators">
            @for (testimonial of testimonials(); track testimonial.name + testimonial.location; let i = $index) {
              <button
                class="indicator"
                [class.active]="i === state().currentIndex"
                (click)="goToTestimonial(i)"
                [attr.aria-label]="'Go to testimonial ' + (i + 1)"
              ></button>
            }
          </div>
        </div>
      }

      <!-- Empty State -->
      @else {
        <div class="empty-state">
          <div class="empty-icon">💬</div>
          <h3 class="empty-title">No testimonials yet</h3>
          <p class="empty-description">Be the first to share your experience!</p>
        </div>
      }
    </article>
  `,
  styleUrls: ['./testimonial.component.scss']
})
export class TestimonialsComponent implements OnInit, OnDestroy {
  // Dependencies
  private readonly dashboardService = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);

  //readonly user = input.required<UserInterface | null>();
  //@Input({ required: true }) user!: Signal<UserInterface | null>;

  // State management
  readonly state = signal<TestimonialState>({
    testimonials: [],
    currentIndex: 0,
    progress: 0,
    isPaused: false,
    isLoading: true,
    error: null
  });

  // Computed values
  readonly testimonials = computed(() => this.state().testimonials);
  readonly currentTestimonial = computed(() => {
    const testimonials = this.testimonials();
    const index = this.state().currentIndex;
    return testimonials[index] || this.getDefaultTestimonial();
  });
  readonly hasTestimonials = computed(() => this.testimonials().length > 0);

  // Configuration
  private readonly CAROUSEL_INTERVAL = 20000; // 20 seconds
  private readonly PROGRESS_UPDATE_INTERVAL = 100; // 100ms for smooth progress

  // Timer management
  private progressTimer?: ReturnType<typeof setInterval>;
  private carouselTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.loadTestimonials();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  loadTestimonials(): void {
    this.updateState({ isLoading: true, error: null });

    this.dashboardService.getRandomTestimonials()
    .pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe({
      next: (response) => {
        const testimonials = Array.isArray(response.data) && response.data.length > 0 
          ? response.data 
          : [];
        
        this.updateState({
          testimonials,
          isLoading: false,
          currentIndex: 0,
          progress: 0
        });

        // Start carousel after testimonials are loaded
        if (testimonials.length > 1) {
          this.startCarousel();
        }
      },
      error: (error) => {
        console.error('Failed to load testimonials:', error);
        this.updateState({
          isLoading: false,
          error: 'Failed to load testimonials. Please try again.'
        });
      }
    });
  }

  nextTestimonial(): void {
    const testimonials = this.testimonials();
    if (testimonials.length <= 1) return;

    const currentIndex = this.state().currentIndex;
    const nextIndex = (currentIndex + 1) % testimonials.length;
    
    this.updateState({
      currentIndex: nextIndex,
      progress: 0
    });

    this.restartTimers();
  }

  previousTestimonial(): void {
    const testimonials = this.testimonials();
    if (testimonials.length <= 1) return;

    const currentIndex = this.state().currentIndex;
    const prevIndex = currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1;
    
    this.updateState({
      currentIndex: prevIndex,
      progress: 0
    });

    this.restartTimers();
  }

  goToTestimonial(index: number): void {
    if (index >= 0 && index < this.testimonials().length && index !== this.state().currentIndex) {
      this.updateState({
        currentIndex: index,
        progress: 0
      });

      this.restartTimers();
    }
  }

  pauseCarousel(): void {
    this.updateState({ isPaused: true });
    this.clearTimers();
  }

  resumeCarousel(): void {
    this.updateState({ isPaused: false });
    if (this.hasTestimonials() && this.testimonials().length > 1) {
      this.startCarousel();
    }
  }

  private startCarousel(): void {
    this.clearTimers();
    
    if (this.state().isPaused || this.testimonials().length <= 1) {
      return;
    }

    // Start progress timer
    this.progressTimer = setInterval(() => {
      if (!this.state().isPaused) {
        this.updateProgress();
      }
    }, this.PROGRESS_UPDATE_INTERVAL);

    // Start carousel timer
    this.carouselTimer = setInterval(() => {
      if (!this.state().isPaused) {
        this.nextTestimonial();
      }
    }, this.CAROUSEL_INTERVAL);
  }

  private restartTimers(): void {
    if (!this.state().isPaused && this.testimonials().length > 1) {
      this.startCarousel();
    }
  }

  private clearTimers(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = undefined;
    }
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = undefined;
    }
  }

  private updateProgress(): void {
    if (this.state().isPaused || !this.hasTestimonials()) return;

    const progressIncrement = (100 / (this.CAROUSEL_INTERVAL / this.PROGRESS_UPDATE_INTERVAL));
    const currentProgress = this.state().progress;
    const newProgress = Math.min(currentProgress + progressIncrement, 100);
    
    this.updateState({ progress: newProgress });
  }

  private updateState(updates: Partial<TestimonialState>): void {
    this.state.update(current => ({ ...current, ...updates }));
  }

  private getDefaultTestimonial(): TestimonialInterface {
    return {
      avatar: '/img/avatar.png',
      message: 'No testimonials available.',
      name: 'Anonymous',
      location: '',
      rating: 0
    };
  }
}