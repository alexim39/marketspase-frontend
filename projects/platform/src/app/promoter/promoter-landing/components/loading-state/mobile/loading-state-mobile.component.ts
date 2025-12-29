import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'loading-state-mobile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-grid-mobile">
      @for (item of [1,2,3]; track $index) {
        <div class="campaign-card-skeleton-mobile">
          <div class="skeleton-header-mobile"></div>
          <div class="skeleton-media-mobile"></div>
          <div class="skeleton-content-mobile">
            <div class="skeleton-line-mobile" style="width: 60%"></div>
            <div class="skeleton-line-mobile"></div>
            <div class="skeleton-line-mobile short"></div>
            <div class="skeleton-metrics-mobile"></div>
            <div class="skeleton-line-mobile" style="width: 35%; height: 20px; margin-top: 12px;"></div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./loading-state-mobile.component.scss']
})
export class LoadingStateMobileComponent {}