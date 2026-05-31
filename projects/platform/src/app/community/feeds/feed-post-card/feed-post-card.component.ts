import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserInterface } from '@shared/services';
import { FeedPost, FeedService } from '../feed.service';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';

type BadgeType = 'top-promoter' | 'verified' | 'rising-star' | 'expert' | 'veteran';

@Component({
  selector: 'app-feed-post-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule, MatMenuModule, MatTooltipModule],
  providers: [FeedService],
  templateUrl: './feed-post-card.component.html',
  styleUrls: ['./feed-post-card.component.scss']
})
export class FeedPostCardComponent {
  post = input.required<FeedPost>();
  user = input.required<UserInterface | null>();
  isLiked = input<boolean>(false);
  isSaved = input<boolean>(false);

  private readonly snackBar = inject(MatSnackBar);
  private readonly feedService = inject(FeedService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  postDeleted = output<string>();
  postUpdated = output<FeedPost>();
  like = output<FeedPost>();
  save = output<string>();
  comment = output<string>();
  share = output<FeedPost>();
  chat = output<FeedPost>();
  sharePlatform = output<string>();
  hide = output<string>();
  report = output<string>();
  hashtagClick = output<string>();

  showFullContent = signal(false);
  activeMediaIndex = signal(0);

  displayContent = computed(() => {
    const content = this.post().content;
    if (this.showFullContent() || content.length <= 200) {
      return content;
    }
    return `${content.substring(0, 200)}...`;
  });

  activeMedia = computed(() => {
    const media = this.post().media || [];
    if (!media.length) return null;
    return media[Math.min(this.activeMediaIndex(), media.length - 1)] || media[0];
  });

  isVerified = computed(() => {
    const rating = this.post().author?.rating;
    return (rating !== undefined && rating !== null && rating > 4.5) || Boolean(this.post().author?.isVerified);
  });

  hashtags = computed(() => {
    const source = this.post().hashtags || [];
    return source
      .map((tag) => typeof tag === 'string' ? tag : tag?.tag || '')
      .filter(Boolean);
  });

  constructor() {
    effect(() => {
      const mediaLength = this.post().media?.length || 0;
      if (!mediaLength) {
        this.activeMediaIndex.set(0);
        return;
      }

      if (this.activeMediaIndex() >= mediaLength) {
        this.activeMediaIndex.set(0);
      }
    });
  }

  toggleReadMore(): void {
    this.showFullContent.update((value) => !value);
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

  onChat(): void {
    this.chat.emit(this.post());
  }

  onShareTo(platform: string): void {
    this.sharePlatform.emit(platform);
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

  openLink(url: string): void {
    window.open(url, '_blank', 'noopener');
  }

  goToProduct(post: FeedPost): void {
    if (!post.product?.productId) return;
    this.router.navigate(['/product', post.product.productId]);
  }

  goToStore(post: FeedPost): void {
    if (!post.product?.storeLink) return;
    this.router.navigate(['/store', post.product.storeLink]);
  }

  getBadgeColor(badge: string): string {
    const colors: Record<BadgeType, string> = {
      'top-promoter': '#10b981',
      'verified': '#3b82f6',
      'rising-star': '#f59e0b',
      'expert': '#8b5cf6',
      'veteran': '#6b7280'
    };

    return this.isValidBadge(badge) ? colors[badge] : '#667eea';
  }

  private isValidBadge(badge: string): badge is BadgeType {
    return ['top-promoter', 'verified', 'rising-star', 'expert', 'veteran'].includes(badge);
  }

  onDelete(post: FeedPost): void {
    const userId = this.user()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in', 'OK', { duration: 2000 });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    this.feedService.deletePost(post._id, userId).subscribe({
      next: () => {
        this.snackBar.open('Post deleted successfully', 'OK', { duration: 2000 });
        this.postDeleted.emit(post._id);
      },
      error: () => {
        this.snackBar.open('Failed to delete post', 'OK', { duration: 2000 });
      }
    });
  }

  onEdit(post: FeedPost): void {
    this.router.navigate(['/dashboard/community/feeds/edit', post._id]);
  }

  viewProfile(post: FeedPost): void {
    if (!post.author?._id) return;
    this.router.navigate(['/dashboard/profile', post.author._id]);
  }

  nextMedia(): void {
    const total = this.post().media?.length || 0;
    if (total <= 1) return;
    this.activeMediaIndex.update((index) => (index + 1) % total);
  }

  previousMedia(): void {
    const total = this.post().media?.length || 0;
    if (total <= 1) return;
    this.activeMediaIndex.update((index) => (index - 1 + total) % total);
  }

  selectMedia(index: number): void {
    this.activeMediaIndex.set(index);
  }

  openImageViewer(media: any): void {
    const images = this.post().media?.filter((entry) => entry.type === 'image') || [];
    if (!images.length) return;

    const initialIndex = images.findIndex((entry) => entry.url === media.url);

    this.dialog.open(ImageViewerComponent, {
      data: {
        images: images.map((entry) => ({
          url: entry.url,
          thumbnail: entry.thumbnail,
          alt: `Image from ${this.post().author?.displayName || 'post'}`
        })),
        initialIndex: initialIndex >= 0 ? initialIndex : 0,
        postId: this.post()._id
      },
      panelClass: 'image-viewer-dialog',
      backdropClass: 'image-viewer-backdrop',
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
      width: '100%',
      hasBackdrop: true,
      disableClose: true,
      autoFocus: false
    });
  }
}
