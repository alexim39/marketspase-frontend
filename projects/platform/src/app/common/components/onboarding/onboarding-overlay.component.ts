import { Component, signal, inject, DestroyRef, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '@shared/services';
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
  styles: [`
    .onboarding-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; }
    .onboarding-sheet { position: fixed; bottom: 0; left: 0; right: 0; z-index: 1001; background: var(--surface-color); border-radius: 24px 24px 0 0; padding: 1.5rem; max-width: 480px; margin: 0 auto; }
    .onboarding-progress { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
    .onboarding-progress mat-progress-bar { flex: 1; }
    .onboarding-progress span { font-size: 0.8rem; color: var(--text-secondary); }
    .onboarding-step { text-align: center; padding: 1rem 0; }
    .step-icon { font-size: 48px; width: 48px; height: 48px; color: var(--primary-color); margin-bottom: 0.75rem; }
    .onboarding-step h2 { margin: 0 0 0.5rem; font-size: 1.2rem; }
    .onboarding-step p { color: var(--text-secondary); line-height: 1.5; max-width: 360px; margin: 0 auto; }
    .onboarding-actions { display: flex; justify-content: space-between; gap: 0.75rem; margin-top: 1rem; }
    .onboarding-skip { width: 100%; margin-top: 0.5rem; color: var(--text-secondary); }
  `],
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
        error: () => null,
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
