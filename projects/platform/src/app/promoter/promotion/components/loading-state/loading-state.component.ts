import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
     <div class="loading-grid">
    @for (item of [1,2,3,4]; track $index) {
      <div class="campaign-card-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-media"></div>
        <div class="skeleton-content">
          <div class="skeleton-line"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-metrics"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    }
  </div>
  `,
  styleUrls: ['./loading-state.component.scss']
})
export class LoadingStateComponent {}