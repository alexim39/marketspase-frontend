import { Component, ChangeDetectionStrategy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FeedPost, FeedService } from './feed.service';
import { FeedPostCardComponent } from './feed-post-card/feed-post-card.component';
import { UserService } from '../../common/services/user.service';
import { CommentDialogComponent } from './comment-dialog/comment-dialog.component';

@Component({
  selector: 'app-public-feed-post',
  standalone: true,
  providers: [FeedService],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FeedPostCardComponent
  ],
  template: `
    <div class="public-feed-page">
      <header class="page-header">
        <button mat-icon-button type="button" class="close-button" (click)="closeViewer()" aria-label="Close post viewer">
          <mat-icon>close</mat-icon>
        </button>
        <div class="header-meta">
          <span class="viewer-label">Post viewer</span>
        </div>
      </header>

      <main class="page-content">
        @if (loading()) {
          <div class="state-card">
            <mat-spinner diameter="32"></mat-spinner>
            <p>Loading post...</p>
          </div>
        } @else if (error()) {
          <div class="state-card">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error() }}</p>
          </div>
        } @else {
          @if (post(); as currentPost) {
            <div class="post-shell">
              <app-feed-post-card
                [post]="currentPost"
                [user]="user()"
                [isLiked]="currentPost.isLiked"
                [isSaved]="currentPost.isSaved"
                (like)="onLike($event)"
                (save)="onSave($event)"
                (comment)="onComment($event)"
                (share)="onShare(currentPost)"
                (chat)="onChat($event)"
                (sharePlatform)="onShare(currentPost, $event)"
                (hashtagClick)="openTag($event)">
              </app-feed-post-card>
            </div>
          }
        }
      </main>
    </div>
  `,
  styles: [`
    .public-feed-page {
      min-height: 100vh;
      background: var(--background-color, #f8fafc);
      color: var(--text-primary, #0f172a);
    }

    .page-header {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid color-mix(in srgb, var(--border-color, rgba(15, 23, 42, 0.08)), transparent 12%);
      background: color-mix(in srgb, var(--surface-color, #ffffff), transparent 8%);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 5;
    }

    .close-button {
      flex-shrink: 0;
      border: 1px solid color-mix(in srgb, var(--border-color, rgba(15, 23, 42, 0.12)), transparent 8%);
      background: color-mix(in srgb, var(--surface-color, #ffffff), var(--background-color, #f8fafc) 24%);
      color: var(--text-primary, #0f172a);
    }

    .header-meta {
      min-width: 0;
    }

    .viewer-label {
      display: inline-flex;
      align-items: center;
      min-height: 40px;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--text-primary, #0f172a);
    }

    .page-content {
      max-width: 760px;
      margin: 0 auto;
      padding: 32px 16px 48px;
    }

    .state-card,
    .post-shell {
      background: var(--surface-color, white);
      border: 1px solid color-mix(in srgb, var(--border-color, rgba(15, 23, 42, 0.08)), transparent 10%);
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }

    .state-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      min-height: 240px;
      color: #475569;
    }

    @media (max-width: 720px) {
      .page-header {
        padding: 12px 16px;
      }

      .page-content {
        padding: 20px 12px 36px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PublicFeedPostComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly feedService = inject(FeedService);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  user = this.userService.user;
  loading = signal(true);
  error = signal<string | null>(null);
  post = signal<FeedPost | null>(null);
  postId = computed(() => this.route.snapshot.paramMap.get('postId') || '');
  returnTo = computed(() => this.route.snapshot.queryParamMap.get('returnTo') || '');

  constructor() {
    effect(() => {
      const postId = this.postId();
      const userId = this.user()?._id;
      if (!postId) return;

      this.loading.set(true);
      this.error.set(null);

      this.feedService.getPostById(postId, userId).subscribe({
        next: (post) => {
          this.post.set(post);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('This post is no longer available.');
          this.loading.set(false);
        }
      });
    });
  }

  private requireAuth(message: string): boolean {
    if (this.user()?._id) return true;
    this.snackBar.open(message, 'Sign in', { duration: 2800 });
    return false;
  }

  onLike(post: FeedPost): void {
    if (!this.requireAuth('Sign in to like posts')) return;
    this.feedService.toggleLike(post, this.user()?._id ?? '').subscribe();
  }

  onSave(postId: string): void {
    if (!this.requireAuth('Sign in to save posts')) return;
    this.feedService.toggleSave(postId, this.user()?._id ?? '').subscribe();
  }

  onComment(postId: string): void {
    if (!this.requireAuth('Sign in to comment')) return;
    this.dialog.open(CommentDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      panelClass: 'comment-dialog-panel',
      disableClose: true,
      data: { postId }
    });
  }

  onShare(post: FeedPost, platform: string = 'copy'): void {
    const shareUrl = `${window.location.origin}/feed/${post._id}`;
    const shareText = `${post.content}\n\nSee more on MarketSpase`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank', 'noopener');
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.snackBar.open('Link copied to clipboard', 'OK', { duration: 2200 });
      });
      platform = 'copy';
    }

    if (this.user()?._id) {
      this.feedService.sharePost(post._id, this.user()?._id ?? '', platform).subscribe();
    }
  }

  onChat(post: FeedPost): void {
    if (!post.phone) {
      this.snackBar.open('No WhatsApp contact is available for this post yet.', 'OK', { duration: 2200 });
      return;
    }

    window.open(
      `https://wa.me/${post.phone}?text=${encodeURIComponent('Hello, I found your post on MarketSpase and I would like to learn more.')}`,
      '_blank',
      'noopener'
    );

    this.feedService.trackChatClick(post._id, this.user()?._id ?? undefined).subscribe({
      next: (payload) => {
        this.post.update((current) => current ? { ...current, chatCount: payload.chatCount } : current);
      },
      error: () => null
    });
  }

  openTag(tag: string): void {
    this.router.navigate(['/dashboard/community/feeds'], { queryParams: { tag } });
  }

  closeViewer(): void {
    const returnTo = this.returnTo();

    if (returnTo) {
      this.router.navigateByUrl(returnTo);
      return;
    }

    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    if (this.user()?._id) {
      this.router.navigate(['/dashboard/community/feeds']);
      return;
    }

    this.router.navigate(['/']);
  }
}
