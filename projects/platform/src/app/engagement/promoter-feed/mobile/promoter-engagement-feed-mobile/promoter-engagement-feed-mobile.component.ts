import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { FeedPostCardComponent } from '../../../../community/feeds/feed-post-card/feed-post-card.component';
import { CommentDialogComponent } from '../../../../community/feeds/comment-dialog/comment-dialog.component';
import { PromoterEngagementFeedComponent } from '../../promoter-engagement-feed.component';

@Component({
  selector: 'app-promoter-engagement-feed-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, FeedPostCardComponent],
  template: `
    <main class="mobile-feed">
      <header class="topbar">
        <button mat-icon-button routerLink="/dashboard"><mat-icon>arrow_back</mat-icon></button>
        <div>
          <span>Engage & Earn</span>
          <h1>Work Feed</h1>
        </div>
        <div class="header-badges">
          @if (activeContractCount()) {
            <span class="badge green"><mat-icon>work</mat-icon>{{ activeContractCount() }}</span>
          } @else {
            <span class="badge red"><mat-icon>work_off</mat-icon>0</span>
          }
          @if (todayEngagements()) {
            <span class="badge amber"><mat-icon>local_fire_department</mat-icon>{{ todayEngagements() }}</span>
          }
        </div>
      </header>

      <div class="mobile-search">
        <mat-icon>search</mat-icon>
        <input type="text" placeholder="Search posts..." (input)="onSearchInput($any($event.target).value)" />
      </div>

      <div class="chip-scroll">
        <button [class.active]="platformFilter() === ''" (click)="platformFilter.set('')">All</button>
        <button [class.active]="platformFilter() === 'facebook'" (click)="platformFilter.set('facebook')">FB</button>
        <button [class.active]="platformFilter() === 'instagram'" (click)="platformFilter.set('instagram')">IG</button>
        <button [class.active]="platformFilter() === 'whatsapp'" (click)="platformFilter.set('whatsapp')">WA</button>
        <button mat-stroked-button (click)="loadContractsAndPosts()"><mat-icon>refresh</mat-icon></button>
      </div>

      @if (loading() && posts().length === 0) {
        <div class="loader"><mat-spinner diameter="32"/><span>Loading your work feed...</span></div>
      } @else if (activeContractCount() === 0 && filteredPosts().length === 0) {
        <div class="empty">
          <mat-icon>work_outline</mat-icon>
          <h3>No active contracts</h3>
          <p>Accept a contract to see posts here.</p>
          <a mat-flat-button color="primary" routerLink="/dashboard/contracts">View Contracts</a>
        </div>
      } @else if (filteredPosts().length === 0) {
        <div class="empty">
          <mat-icon>dynamic_feed</mat-icon>
          <h3>No posts match</h3>
          <p>Try a different search or filter.</p>
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
              (chat)="onChatClick(post)"
              (sharePlatform)="onEngage(post, 'share')"
              (repost)="onEngage(post, 'share')"
            />
          }
        </div>
        @if (loadingMore()) {
          <div class="loader-more"><mat-spinner diameter="22"/></div>
        }
      }
    </main>
  `,
  styleUrls: ['./promoter-engagement-feed-mobile.component.scss']
})
export class PromoterEngagementFeedMobileComponent extends PromoterEngagementFeedComponent {}
