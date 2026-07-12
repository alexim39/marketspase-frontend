import { Component, signal, inject, DestroyRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ApiService } from '@shared/services/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const STEPS = [
  {
    id: 'welcome',
    icon: 'waving_hand',
    title: 'Welcome to MarketSpase!',
    // description: 'The social platform where businesses grow and everyday users earn by connecting, promoting, selling, and growing together.'
    description: `MarketSpase connects businesses (marketers) with everyday internet users (promoters) who promote businesses on WhatsApp, Facebook, Instagram, TikTok, and more. 
       Businesses get more sales and visibility, while promoters earn from performance.`
  },
  {
    id: 'get_started',
    icon: 'rocket_launch',
    title: 'Choose How You Want to Grow',
    description: 'Business owners (Marketers) can creates stores and ad campaigns to grow their businesses. Everyday users (Promoters) can discover opportunities, promote products, ads, and earn commissions.'
  },
  {
    id: 'guide',
    icon: 'play_circle',
    title: 'Watch the Quick Guide',
    description: 'Click the Get Started button to watch a short tutorial to learn how MarketSpase works, then start exploring, promoting, and expanding immediately.'
  },
];

@Component({
  selector: 'app-onboarding-overlay',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule, RouterModule],
  template: `
    @if (visible() && !dismissed()) {
      <div class="onboarding-backdrop" (click)="dismiss()"></div>
      <div class="onboarding-sheet">
        <div class="onboarding-progress">
          <mat-progress-bar mode="determinate" [value]="((currentStep() + 1) / steps.length) * 100"></mat-progress-bar>
          <span>{{ currentStep() + 1 }} of {{ steps.length }}</span>
        </div>
        <div class="onboarding-step">
          <mat-icon class="step-icon">{{ currentStepData.icon }}</mat-icon>
          <h2>{{ currentStepData.title }}</h2>
          <p>{{ currentStepData.description }}</p>
        </div>
        @if (isLastStep()) {
          <div class="onboarding-video">
            <p class="video-label"><mat-icon>play_circle</mat-icon> Watch a quick guide</p>
            <div class="video-wrapper">
              <iframe
                [src]="demoVideoUrl"
                title="MarketSpase introduction"
                loading="lazy"
                frameborder="0"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen>
              </iframe>
            </div>
          </div>
        }
        <div class="onboarding-actions">
          @if (currentStep() > 0) {
            <button mat-button (click)="prev()">Back</button>
          }
          @if (isLastStep()) {
            <!-- <button mat-stroked-button color="primary" routerLink="/dashboard/get-started/onboarding" (click)="finish()">
              <mat-icon>play_circle</mat-icon> Watch Guide
            </button> -->
            <button mat-flat-button color="primary" (click)="getStarted()">
              <!-- <mat-icon>rocket_launch</mat-icon>  -->Get Started
            </button>
          } @else {
            <button mat-flat-button color="primary" (click)="next()">Next</button>
          }
        </div>
        <button class="onboarding-skip" mat-button (click)="dismiss()">Skip</button>
      </div>
    }
  `,
  styleUrls: ['./onboarding-overlay.component.scss'],
})
export class OnboardingOverlayComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);
  readonly completed = output<void>();

  readonly steps = STEPS;
  readonly currentStep = signal(0);
  readonly visible = signal(false);
  readonly dismissed = signal(false);

  readonly demoVideoUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://www.youtube.com/embed/3dxS8th0WJo?start=725&rel=0&modestbranding=1&playsinline=1'
  );

  constructor() {
    this.api.get<any>('api/v1/user/onboarding', undefined, undefined, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          if (!r?.data?.completed && !r?.data?.dismissed) {
            this.visible.set(true);
          }
        },
        error: () => { this.visible.set(true); },
      });
  }

  get currentStepData() { return this.steps[this.currentStep()]; }
  isLastStep() { return this.currentStep() === this.steps.length - 1; }

  next() { if (this.currentStep() < this.steps.length - 1) this.currentStep.update(v => v + 1); }
  prev() { if (this.currentStep() > 0) this.currentStep.update(v => v - 1); }

  getStarted() {
    this.finish();
    this.router.navigate(['/dashboard/get-started/onboarding']);
  }

  finish() {
    this.api.post('api/v1/user/onboarding/complete', { step: this.steps[this.currentStep()].id }, undefined, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.visible.set(false); this.completed.emit(); });
  }

  dismiss() {
    this.api.post('api/v1/user/onboarding/dismiss', {}, undefined, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.visible.set(false); this.dismissed.set(true); });
  }
}
