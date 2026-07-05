import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpParams } from '@angular/common/http';
import { FeedService } from '../../community/feeds/feed.service';
import { FeedPostCardComponent } from '../../community/feeds/feed-post-card/feed-post-card.component';
import { UserService } from '../../common/services/user.service';
import { EngagementService } from '../engagement.service';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-promoter-engagement-feed',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, FeedPostCardComponent],
  template: `
    <div class="feed-page">
      <header class="feed-header">
        <div>
          <h1>Engagement Feed</h1>
          <p>Like, comment, and share marketer posts to earn</p>
        </div>
        <div class="header-stats">
          @if (activeContractCount()) {
            <span class="active-badge">
              <mat-icon>work</mat-icon> {{ activeContractCount() }} active contract{{ activeContractCount() > 1 ? 's' : '' }}
            </span>
          }
          @if (todayEngagements()) {
            <span class="today-badge">
              <mat-icon>local_fire_department</mat-icon> {{ todayEngagements() }} today
            </span>
          }
        </div>
      </header>

      <div class="filter-row">
        <div class="filter-chips">
          <button [class.active]="platformFilter() === ''" (click)="platformFilter.set('')">All</button>
          <button [class.active]="platformFilter() === 'facebook'" (click)="platformFilter.set('facebook')">Facebook</button>
          <button [class.active]="platformFilter() === 'instagram'" (click)="platformFilter.set('instagram')">Instagram</button>
          <button [class.active]="platformFilter() === 'whatsapp'" (click)="platformFilter.set('whatsapp')">WhatsApp</button>
        </div>
        <button mat-stroked-button (click)="loadPosts(true)" [disabled]="loading()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      @if (loading() && posts().length === 0) {
        <div class="loading-state"><mat-spinner diameter="32"/><span>Loading engagement feed...</span></div>
      } @else if (filteredPosts().length === 0) {
        <div class="empty-state">
          <mat-icon>dynamic_feed</mat-icon>
          <h3>No posts to engage with</h3>
          <p>Check back later or refresh for new posts from marketers</p>
        </div>
      } @else {
        <div class="posts-feed">
          @for (post of filteredPosts(); track post._id) {
            <app-feed-post-card
              [user]="user()"
              [post]="post"
              [isLiked]="likedPosts().has(post._id)"
              [isSaved]="savedPosts().has(post._id)"
              (like)="onEngage(post, 'like')"
              (save)="onEngage(post, 'save')"
              (comment)="onEngage(post, 'comment')"
              (share)="onEngage(post, 'share')"
            />
          }
        </div>
      }

      @if (hasMore()) {
        <button class="load-more" (click)="loadPosts(false)">Load more</button>
      }
    </div>
  `,
  styles: [`
    .feed-page { max-width: 640px; margin: 0 auto; padding: 16px; }
    .feed-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; h1 { margin: 0; font-size: 1.3rem; } p { margin: 0; color: var(--text-secondary); font-size: 0.85rem; } }
    .header-stats { display: flex; gap: 8px; .active-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: rgba(var(--success-rgb), 0.1); color: var(--success-color); mat-icon { font-size: 16px; width: 16px; height: 16px; } } .today-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; background: rgba(var(--warning-rgb), 0.1); color: var(--warning-color); mat-icon { font-size: 16px; width: 16px; height: 16px; } } }
    .filter-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
    .filter-chips { display: flex; gap: 4px; flex-wrap: wrap; button { padding: 5px 12px; border-radius: 999px; border: 1px solid var(--border-color); background: var(--surface-color); font-size: 0.75rem; font-weight: 600; cursor: pointer; &.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); } } }
    .posts-feed { display: flex; flex-direction: column; gap: 12px; }
    .loading-state, .empty-state { text-align: center; padding: 40px; color: var(--text-secondary); mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; opacity: 0.3; margin-bottom: 8px; } }
    .load-more { width: 100%; padding: 12px; margin-top: 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-color); font-weight: 600; cursor: pointer; }
  `]
})
export class PromoterEngagementFeedComponent implements OnInit {
  private feedService = inject(FeedService);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private userService = inject(UserService);
  private engagementService = inject(EngagementService);

  user = this.userService.user;
  posts = signal<any[]>([]);
  loading = signal(true);
  platformFilter = signal('');
  likedPosts = signal<Set<string>>(new Set());
  savedPosts = signal<Set<string>>(new Set());
  activeContractCount = signal(0);
  todayEngagements = signal(0);
  page = 1;

  filteredPosts = computed(() => {
    const f = this.platformFilter();
    if (!f) return this.posts();
    return this.posts().filter(p => p.socialPlatform === f);
  });

  hasMore = computed(() => this.posts().length >= this.page * 10);

  ngOnInit(): void {
    this.loadPosts(true);
    this.loadContractCount();
  }

  loadPosts(reset: boolean): void {
    if (reset) { this.page = 1; this.posts.set([]); }
    this.loading.set(true);

    this.api.get<any>('api/v1/feeds/list', new HttpParams().set('page', this.page).set('limit', '10'), undefined, true).subscribe({
      next: (r: any) => {
        const newPosts = (r?.data || r?.posts || []).filter((p: any) =>
          p.source === 'manual' || p.socialPlatform || p.campaign || p.isBoosted
        );
        this.posts.update(prev => reset ? newPosts : [...prev, ...newPosts]);
        this.page++;
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadContractCount(): void {
    this.engagementService.listContracts('promoter').subscribe({
      next: (r: any) => {
        const contracts = r?.data || [];
        this.activeContractCount.set(contracts.filter((c: any) => c.status === 'active').length);
      }
    });
  }

  onEngage(post: any, type: string): void {
    if (!post?._id) return;

    if (type === 'like') {
      this.api.post(`api/v1/feeds/${post._id}/like`, {}, undefined, true).subscribe(() => {
        const set = new Set(this.likedPosts());
        if (set.has(post._id)) { set.delete(post._id); } else { set.add(post._id); }
        this.likedPosts.set(set);
        this.trackEngagement(post, type);
      });
    } else if (type === 'save') {
      this.api.post(`api/v1/feeds/${post._id}/save`, {}, undefined, true).subscribe(() => {
        const set = new Set(this.savedPosts());
        if (set.has(post._id)) { set.delete(post._id); } else { set.add(post._id); }
        this.savedPosts.set(set);
      });
    } else if (type === 'share') {
      this.api.post(`api/v1/feeds/${post._id}/share`, { platform: 'internal' }, undefined, true).subscribe(() => {
        this.trackEngagement(post, type);
        this.snack.open('Post shared!', 'OK', { duration: 1500 });
      });
    } else if (type === 'comment') {
      const comment = prompt('Write a meaningful comment:');
      if (comment?.trim()) {
        this.api.post(`api/v1/feeds/${post._id}/comments`, { content: comment.trim() }, undefined, true).subscribe(() => {
          this.trackEngagement(post, type);
          this.snack.open('Comment posted!', 'OK', { duration: 1500 });
        });
      }
    }
  }

  private trackEngagement(post: any, type: string): void {
    this.todayEngagements.update(v => v + 1);
    // Auto-track toward active contracts
    this.engagementService.listContracts('promoter').subscribe({
      next: (r: any) => {
        const contracts = (r?.data || []).filter((c: any) =>
          c.status === 'active' && c.marketerId?._id === (post.author?._id || post.author)
        );
        for (const contract of contracts) {
          const taskIndex = contract.tasks?.findIndex((t: any) => t.type === type);
          if (taskIndex >= 0) {
            const task = contract.tasks[taskIndex];
            if (task.completed < task.target) {
              this.engagementService.updateTaskProgress(contract._id, taskIndex, task.completed + 1).subscribe();
            }
          }
        }
      }
    });
  }
}
