import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FeedPostCardComponent } from '../../../../community/feeds/feed-post-card/feed-post-card.component';
import { PromoterEngagementFeedComponent } from '../../promoter-engagement-feed.component';

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
  styleUrls: ['./promoter-engagement-feed-mobile.component.scss']
    
})
export class PromoterEngagementFeedMobileComponent extends PromoterEngagementFeedComponent {}
