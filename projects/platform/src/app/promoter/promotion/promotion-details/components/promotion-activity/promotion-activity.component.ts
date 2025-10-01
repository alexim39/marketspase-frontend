import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PromotionInterface } from '../../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-promotion-activity',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="activity-section" *ngIf="promotion.activityLog && promotion.activityLog.length > 0">
      <h3 class="section-title">Activity Timeline</h3>
      <div class="timeline">
        <div class="timeline-item" *ngFor="let log of promotion.activityLog">
          <div class="timeline-marker"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="log-action">{{log.action}}</span>
              <span class="log-time">{{log.timestamp | date:'medium'}}</span>
            </div>
            <p class="log-details">{{log.details}}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./promotion-activity.component.scss']
})
export class PromotionActivityComponent {
  @Input() promotion!: PromotionInterface;
}