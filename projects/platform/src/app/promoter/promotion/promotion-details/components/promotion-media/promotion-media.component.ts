import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PromotionInterface } from '../../../../../../../../shared-services/src/public-api';
import { CategoryPlaceholderPipe } from '../../../../../common/pipes/category-placeholder.pipe';

@Component({
  selector: 'app-promotion-media',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, CategoryPlaceholderPipe],
  template: `
    <div class="promotion-media">
      <div class="media-container">
        <div class="media-type-overlay" [ngClass]="promotion.campaign.mediaType">
          <mat-icon>{{ promotion.campaign.mediaType === 'video' ? 'videocam' : 'image' }}</mat-icon>
          <span>{{ promotion.campaign.mediaType | titlecase }}</span>
        </div>
        
        @if (promotion.campaign.mediaType === 'image') {
          <img [src]="apiUrl + promotion.campaign.mediaUrl" [alt]="promotion.campaign.title" class="media-preview">
        } @else if (promotion.campaign.mediaType === 'video') {
          <div class="video-container">
            <div class="video-placeholder">
              <img [src]="promotion.campaign.category | categoryPlaceholder" class="placeholder-img" />
              <div class="video-play-btn">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
              </div>
            </div>
          </div>
        }
      </div>
      
      <div class="media-actions">
        <button mat-flat-button class="btn btn-primary" (click)="share.emit()">
          <mat-icon>share</mat-icon>
          WhatsApp
        </button>
       <!--  <button mat-flat-button class="btn btn-outline" (click)="download.emit()">
          <mat-icon>download</mat-icon>
          Download
        </button> -->
      </div>
    </div>
  `,
  styleUrls: ['./promotion-media.component.scss']
})
export class PromotionMediaComponent {
  @Input() promotion!: PromotionInterface;
  @Input() apiUrl!: string;
  @Output() share = new EventEmitter<void>();
  @Output() download = new EventEmitter<void>();
}