import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-state',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="error-container">
      <mat-icon class="error-icon">{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      @if (message()) { <p>{{ message() }}</p> }
      @if (retryLabel()) {
        <button mat-stroked-button color="primary" (click)="retry.emit()">
          <mat-icon>refresh</mat-icon>
          {{ retryLabel() }}
        </button>
      }
    </div>
  `,
  styles: [`
    .error-container { display: grid; place-items: center; gap: 0.5rem; padding: 2.5rem 1.5rem; text-align: center; color: var(--text-secondary); }
    .error-icon { font-size: 48px; width: 48px; height: 48px; color: var(--error-color, #ef4444); }
    h3 { margin: 0; color: var(--text-primary); font-size: 1.05rem; }
    p { margin: 0; max-width: 420px; }
  `],
})
export class SharedErrorStateComponent {
  readonly icon = input('error_outline');
  readonly title = input('Something went wrong');
  readonly message = input('');
  readonly retryLabel = input('Try Again');
  readonly retry = output<void>();
}
