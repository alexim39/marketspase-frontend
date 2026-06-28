import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'click-cap-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="cap-warning" role="alert">
      <mat-icon>speed</mat-icon>
      <span>
        @if (todayClicks() >= 200) {
          Daily limit reached (200 clicks). Resets tomorrow.
        } @else if (todayClicks() >= 150) {
          Approaching daily limit: {{ todayClicks() }}/200 clicks today
        } @else {
          Each promotion link is limited to 200 billable clicks per day. This prevents budget drain and fraud.
        }
      </span>
    </div>
  `,
  styleUrl: './click-cap-indicator.component.scss',
})
export class ClickCapIndicatorComponent {
  readonly promotionId = input<string>('');
  readonly todayClicks = input<number>(0);
}
