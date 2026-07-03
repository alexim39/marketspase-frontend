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
  styleUrl: './loading-state.component.scss'
})
export class SharedLoadingStateComponent {
  readonly variant = input<'spinner' | 'bar' | 'skeleton'>('bar');
  readonly message = input('');
  readonly spinnerSize = input(34);
  readonly skeletonCount = input(4);
  readonly skeletonArray = () => Array.from({ length: this.skeletonCount() }, (_, i) => i);
}
