import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedPost } from '../feed.service';

type BadgeType = 'top-promoter' | 'verified' | 'rising-star' | 'expert' | 'veteran';

@Component({
  selector: 'app-feed-post-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatTooltipModule
  ],
  templateUrl: './feed-post-card.component.html',
  styleUrls: ['./feed-post-card.component.scss']
})
export class FeedPostCardComponent {
  post = input.required<FeedPost>();
  isLiked = input<boolean>(false);
  isSaved = input<boolean>(false);
  
  // Computed property for verified status
  isVerified = computed(() => {
    const rating = this.post().author.rating;
    return rating !== undefined && rating !== null && rating > 4.5;
  });
  
  // Output events
  like = output<FeedPost>();
  save = output<string>();
  comment = output<string>();
  share = output<FeedPost>();
  hide = output<string>();
  report = output<string>();
  hashtagClick = output<string>();

  // Event handler methods
  onLike(): void {
    this.like.emit(this.post());
  }

  onSave(): void {
    this.save.emit(this.post()._id);
  }

  onComment(): void {
    this.comment.emit(this.post()._id);
  }

  onShare(): void {
    this.share.emit(this.post());
  }

  onHide(): void {
    this.hide.emit(this.post()._id);
  }

  onReport(): void {
    this.report.emit(this.post()._id);
  }

  onHashtagClick(tag: string): void {
    this.hashtagClick.emit(tag);
  }
  
  getBadgeColor(badge: string): string {
    const colors: Record<BadgeType, string> = {
      'top-promoter': '#10b981',
      'verified': '#3b82f6',
      'rising-star': '#f59e0b',
      'expert': '#8b5cf6',
      'veteran': '#6b7280'
    };
    
    if (this.isValidBadge(badge)) {
      return colors[badge];
    }
    
    return '#667eea';
  }

  private isValidBadge(badge: string): badge is BadgeType {
    return ['top-promoter', 'verified', 'rising-star', 'expert', 'veteran'].includes(badge);
  }

  
}