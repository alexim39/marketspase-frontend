import { Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedPost } from '../feed.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
  private snackBar = inject(MatSnackBar);

  // Read more state
  showFullContent = signal(false);

  // Computed for truncated content
  displayContent = computed(() => {
    const content = this.post().content;
    if (this.showFullContent() || content.length <= 200) {
      return content;
    }
    return content.substring(0, 200) + '…';
  });

  // Computed property for verified status
  isVerified = computed(() => {
    const rating = this.post().author?.rating;
    return rating !== undefined && rating !== null && rating > 4.5;
  });

  // Helper to convert hashtags to array of strings
  getHashtagsAsArray = computed(() => {
    const hashtags = this.post().hashtags;
    if (!hashtags || hashtags.length === 0) return [];

    return hashtags.map(tag => {
      if (typeof tag === 'string') return tag;
      return (tag as any).tag || '';
    }).filter(tag => tag);
  });

  // Output events
  like = output<FeedPost>();
  save = output<string>();
  comment = output<string>();
  share = output<FeedPost>();
  hide = output<string>();
  report = output<string>();
  hashtagClick = output<string>();

  toggleReadMore(): void {
    this.showFullContent.update(v => !v);
  }

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

  playVideo(media: any): void {
    // Optional: could open in a modal, but now we use inline <video>
    if (media.url) {
      // For inline, we rely on the video element; this method could be removed.
    }
  }

  openLink(url: string): void {
    window.open(url, '_blank');
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

  // Open WhatsApp chat (example – you can adjust the link structure)
  openWhatsApp(post: FeedPost): void {
    // Assuming the post has a contact number or WhatsApp link
    // e.g., post.campaign?.contactWhatsapp or post.author?.phone
    const phone = post.phone;
    if (phone) {
      const url = `https://wa.me/${post.phone}?text=Hello%20I%20found%20your%20business%20on%20MarketSpase%20and%20I’m%20interested%20in%20what%20you%20offer.%20Please%20share%20more%20details.`;
      window.open(url, '_blank');
    } else {
        this.snackBar.open('No contact number available', 'OK', { duration: 2000 });
    }
  }

  toggleFollow(post: FeedPost): void {
    // This would ideally emit an event to the parent to handle follow/unfollow logic
    // For now, we can just show a snackbar as a placeholder
    this.snackBar.open('Follow/unfollow functionality not implemented', 'OK', { duration: 2000 });
  }
  
}