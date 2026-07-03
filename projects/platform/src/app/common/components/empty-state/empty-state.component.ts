import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="empty-container">
      <mat-icon class="empty-icon">{{ icon() }}</mat-icon>
      @if (title()) { <h3>{{ title() }}</h3> }
      <p>{{ message() }}</p>
      @if (actionLabel() && actionRoute()) {
        <a mat-flat-button color="primary" [routerLink]="actionRoute()">
          @if (actionIcon()) { <mat-icon>{{ actionIcon() }}</mat-icon> }
          {{ actionLabel() }}
        </a>
      } @else if (actionLabel()) {
        <button mat-flat-button color="primary" (click)="action.emit()">
          @if (actionIcon()) { <mat-icon>{{ actionIcon() }}</mat-icon> }
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styleUrl: './empty-state.component.scss'
})
export class SharedEmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input('');
  readonly message = input('No data available.');
  readonly actionLabel = input('');
  readonly actionIcon = input('');
  readonly actionRoute = input('');
  readonly action = output<void>();
}
