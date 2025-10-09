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
  styles: [`
    .testimonials-container {
      --primary-color: #667eea;
      --primary-light: #e6f2ff;
      --secondary-color: #64748b;
      --text-primary: #1e293b;
      --text-secondary: #64748b;
      --text-muted: #94a3b8;
      --border-color: #e2e8f0;
      --background-white: #ffffff;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --border-radius: 12px;
      --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      background: var(--background-white);
      border-radius: var(--border-radius);
      padding: 2rem;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-color);
      position: relative;
      overflow: hidden;
    }

    .testimonials-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color), #667eea);
    }

    .testimonials-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      line-height: 1.2;
      letter-spacing: -0.025em;
    }

    .section-subtitle {
      font-size: 1rem;
      color: var(--text-secondary);
      margin: 0;
      font-weight: 500;
    }

    .testimonial-carousel {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      position: relative;
    }

    .nav-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3rem;
      height: 3rem;
      background: var(--background-white);
      border: 2px solid var(--border-color);
      border-radius: 50%;
      cursor: pointer;
      color: var(--text-secondary);
      transition: var(--transition);
      flex-shrink: 0;
    }

    .nav-button:hover:not(:disabled) {
      border-color: var(--primary-color);
      color: var(--primary-color);
      transform: scale(1.05);
      box-shadow: var(--shadow-md);
    }

    .nav-button:active {
      transform: scale(0.95);
    }

    .nav-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .testimonial-card {
      flex: 1;
      background: linear-gradient(135deg, var(--primary-light) 0%, var(--background-white) 100%);
      border-radius: var(--border-radius);
      padding: 2rem;
      border: 1px solid var(--border-color);
      transition: var(--transition);
      position: relative;
    }

    .testimonial-card::before {
      content: '"';
      position: absolute;
      top: 1rem;
      left: 1.5rem;
      font-size: 4rem;
      color: var(--primary-color);
      opacity: 0.2;
      font-family: serif;
      line-height: 1;
    }

    .card-content {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .testimonial-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-image {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--background-white);
      box-shadow: var(--shadow-md);
    }

    .avatar-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 1.5rem;
      height: 1.5rem;
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--background-white);
    }

    .testimonial-content {
      flex: 1;
      position: relative;
      z-index: 1;
    }

    .testimonial-rating {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .stars {
        display: flex;
        
        mat-icon {
          color: #ffc107;
          font-size: 20px;
          height: 20px;
          width: 20px;
        }
      }

      .rating-value {
        color: #666;
        font-size: 14px;
        font-weight: 500;
      }
    }

    .testimonial-message {
      font-size: 1.125rem;
      line-height: 1.7;
      color: var(--text-primary);
      margin: 0 0 1.5rem 0;
      font-weight: 500;
      font-style: italic;
    }

    .testimonial-footer {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .author-name {
      font-weight: 600;
      color: var(--text-primary);
      font-size: 1rem;
      font-style: normal;
    }

    .author-location {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .progress-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-bar {
      height: 4px;
      background: var(--border-color);
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-color), #667eea);
      transform-origin: left;
      transition: transform 0.1s linear;
    }

    .testimonial-indicators {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }

    .indicator {
      width: 0.75rem;
      height: 0.75rem;
      border-radius: 50%;
      border: none;
      background: var(--border-color);
      cursor: pointer;
      transition: var(--transition);
    }

    .indicator.active {
      background: var(--primary-color);
      transform: scale(1.2);
    }

    .indicator:hover {
      background: var(--text-secondary);
      transform: scale(1.1);
    }

    /* Loading State */
    .loading-skeleton {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
    }

    .skeleton-avatar {
      width: 4rem;
      height: 4rem;
      border-radius: 50%;
      background: linear-gradient(90deg, var(--border-color) 25%, transparent 37%, var(--border-color) 63%);
      background-size: 400% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-line {
      height: 1rem;
      border-radius: 0.5rem;
      background: linear-gradient(90deg, var(--border-color) 25%, transparent 37%, var(--border-color) 63%);
      background-size: 400% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    .skeleton-line--long { width: 100%; }
    .skeleton-line--medium { width: 70%; }
    .skeleton-line--short { width: 40%; }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-message {
      color: var(--text-secondary);
      margin-bottom: 1.5rem;
      font-size: 1.125rem;
    }

    .retry-button {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: var(--transition);
    }

    .retry-button:hover {
      background: #667eea;
      transform: translateY(-1px);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.6;
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
    }

    .empty-description {
      color: var(--text-secondary);
      font-size: 1rem;
      margin: 0;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .testimonials-container {
        padding: 1.5rem;
      }

      .section-title {
        font-size: 1.625rem;
      }
    }

    @media (max-width: 768px) {
      .testimonials-container {
        padding: 1rem;
      }

      .section-title {
        font-size: 1.5rem;
      }

      .testimonial-carousel {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-button {
        width: 2.5rem;
        height: 2.5rem;
      }

      .card-content {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .testimonial-message {
        font-size: 1rem;
      }

      .nav-button--prev {
        order: -1;
        align-self: flex-start;
      }

      .nav-button--next {
        order: 1;
        align-self: flex-end;
      }
    }

    @media (max-width: 480px) {
      .testimonials-container {
        padding: 1rem 0.75rem;
      }

      .section-title {
        font-size: 1.375rem;
      }

      .testimonial-card {
        padding: 1.5rem 1rem;
      }
    }

    /* Focus States for Accessibility */
    .nav-button:focus-visible,
    .indicator:focus-visible,
    .retry-button:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* Reduced Motion Support */
    @media (prefers-reduced-motion: reduce) {
      .nav-button,
      .indicator,
      .testimonial-card,
      .progress-fill {
        transition: none;
      }

      .skeleton-loading {
        animation: none;
      }
    }
  `]
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