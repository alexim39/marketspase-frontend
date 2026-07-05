import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeedPostCardComponent } from '../../../community/feeds/feed-post-card/feed-post-card.component';
import { PromoterEngagementFeedComponent } from '../promoter-engagement-feed.component';

@Component({
  selector: 'app-promoter-engagement-feed-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, FeedPostCardComponent],
  template: `
    <main class="mobile-feed">
      <header class="topbar">
        <button mat-icon-button routerLink="/dashboard"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <span>Engage & Earn</span>
          <h1>Feed</h1>
        </div>
        <div class="header-badges">
          @if (activeContractCount()) {
            <span class="badge green"><mat-icon>work</mat-icon>{{ activeContractCount() }}</span>
          }
          @if (todayEngagements()) {
            <span class="badge amber"><mat-icon>local_fire_department</mat-icon>{{ todayEngagements() }}</span>
          }
        </div>
      </header>

      <div class="chip-scroll">
        <button [class.active]="platformFilter() === ''" (click)="platformFilter.set('')">All</button>
        <button [class.active]="platformFilter() === 'facebook'" (click)="platformFilter.set('facebook')">FB</button>
        <button [class.active]="platformFilter() === 'instagram'" (click)="platformFilter.set('instagram')">IG</button>
        <button [class.active]="platformFilter() === 'whatsapp'" (click)="platformFilter.set('whatsapp')">WA</button>
        <button mat-stroked-button (click)="loadPosts(true)"><mat-icon>refresh</mat-icon></button>
      </div>

      @if (loading() && posts().length === 0) {
        <div class="loader"><mat-spinner diameter="32"/><span>Loading...</span></div>
      } @else if (filteredPosts().length === 0) {
        <div class="empty">
          <mat-icon>dynamic_feed</mat-icon>
          <h3>No posts</h3>
          <p>Check back for new posts from marketers</p>
        </div>
      } @else {
        <div class="feed-list">
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
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100dvh; background: var(--background-color); }
    .topbar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--surface-color); border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .topbar span { display: block; font-size: 0.68rem; color: var(--text-tertiary); } .topbar h1 { margin: 0; font-size: 1rem; font-weight: 700; flex: 1; }
    .header-badges { display: flex; gap: 6px; .badge { display: inline-flex; align-items: center; gap: 3px; padding: 3px 8px; border-radius: 999px; font-size: 0.68rem; font-weight: 700; mat-icon { font-size: 14px; width: 14px; height: 14px; } &.green { background: rgba(var(--success-rgb),0.1); color: var(--success-color); } &.amber { background: rgba(var(--warning-rgb),0.1); color: var(--warning-color); } } }
    .chip-scroll { display: flex; gap: 5px; padding: 10px 14px; overflow-x: auto; scrollbar-width: none; &::-webkit-scrollbar { display: none; } button { flex-shrink: 0; padding: 5px 12px; border-radius: 999px; border: 1px solid var(--border-color); background: var(--surface-color); font-size: 0.72rem; font-weight: 600; cursor: pointer; &.active { background: var(--primary-color); color: #fff; border-color: var(--primary-color); } } }
    .feed-list { padding: 0 14px 100px; display: flex; flex-direction: column; gap: 10px; }
    .loader, .empty { text-align: center; padding: 40px; color: var(--text-secondary); mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; opacity: 0.3; } }
    .load-more { width: calc(100% - 28px); margin: 16px 14px; padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--surface-color); font-weight: 600; }
  `]
})
export class PromoterEngagementFeedMobileComponent extends PromoterEngagementFeedComponent {}
