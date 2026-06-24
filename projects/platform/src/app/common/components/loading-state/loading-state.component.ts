import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-container">
      @if (variant() === 'skeleton') {
        <div class="loading-skeleton" [style.--skeleton-count]="skeletonCount()">
          @for (i of skeletonArray(); track i) {
            <ng-content select="[skeleton]" />
          }
        </div>
      } @else if (variant() === 'spinner') {
        <div class="loading-spinner">
          <mat-spinner [diameter]="spinnerSize()"></mat-spinner>
          @if (message()) { <p>{{ message() }}</p> }
        </div>
      } @else {
        <div class="loading-bar">
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          @if (message()) { <p>{{ message() }}</p> }
        </div>
      }
    </div>
  `,
  styles: [`
    .loading-container { display: grid; place-items: center; padding: 2rem 1rem; }
    .loading-spinner, .loading-bar { display: grid; gap: 0.75rem; justify-items: center; }
    .loading-spinner p, .loading-bar p { color: var(--text-secondary); font-size: 0.88rem; margin: 0; }
    .loading-skeleton { display: grid; gap: 1rem; width: 100%; }
  `],
})
export class SharedLoadingStateComponent {
  readonly variant = input<'spinner' | 'bar' | 'skeleton'>('bar');
  readonly message = input('');
  readonly spinnerSize = input(34);
  readonly skeletonCount = input(4);
  readonly skeletonArray = () => Array.from({ length: this.skeletonCount() }, (_, i) => i);
}
