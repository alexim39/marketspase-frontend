import { Component, signal, inject, DestroyRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '@shared/services/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const STEPS = [
  { id: 'welcome', icon: 'waving_hand', title: 'Welcome to MarketSpase!', description: 'Connect with promoters or marketers to grow your business. Let\'s get you started in 3 quick steps.' },
  { id: 'first_campaign', icon: 'campaign', title: 'Find or Create a Campaign', description: 'Marketers: create your first campaign. Promoters: browse and join campaigns matching your audience.' },
  { id: 'first_message', icon: 'chat', title: 'Start Collaborating', description: 'Open your campaign room and send your first message. Real-time chat keeps everyone aligned.' },
];

@Component({
  selector: 'app-onboarding-overlay',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressBarModule],
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
        <div class="onboarding-actions">
          @if (currentStep() > 0) {
            <button mat-button (click)="prev()">Back</button>
          }
          @if (currentStep() < steps.length - 1) {
            <button mat-flat-button color="primary" (click)="next()">Next</button>
          } @else {
            <button mat-flat-button color="primary" (click)="finish()">Get Started</button>
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
  private destroyRef = inject(DestroyRef);
  readonly completed = output<void>();

  readonly steps = STEPS;
  readonly currentStep = signal(0);
  readonly visible = signal(false);
  readonly dismissed = signal(false);

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

  next() { if (this.currentStep() < this.steps.length - 1) this.currentStep.update(v => v + 1); }
  prev() { if (this.currentStep() > 0) this.currentStep.update(v => v - 1); }

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
