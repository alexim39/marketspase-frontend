import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="loading-state">
      <mat-progress-bar mode="indeterminate"/>
      <p>Loading promotions...</p>
    </div>
  `,
  styles: [`
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      mat-progress-bar {
        width: 20em;
      }
      p {
        margin-top: 16px;
        color: #777;
      }
    }
  `]
})
export class LoadingStateComponent {}