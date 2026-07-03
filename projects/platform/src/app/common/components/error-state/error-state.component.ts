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
  styleUrl: './error-state.component.scss'
})
export class SharedErrorStateComponent {
  readonly icon = input('error_outline');
  readonly title = input('Something went wrong');
  readonly message = input('');
  readonly retryLabel = input('Try Again');
  readonly retry = output<void>();
}
