// community-feed.component.ts (complete updated version)
import { Component, input, output, inject, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommunityFeedService } from './community-feed.service';

@Component({
  selector: 'community-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './community-feed.component.html',
  styleUrls: ['./community-feed.component.scss']
})
export class CommunityFeedComponent implements OnInit {
  protected feedService = inject(CommunityFeedService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  userRole = input<string | undefined>();

  // Inputs
  userId = input<string>();
  limit = input<number>(3);
  showHeader = input<boolean>(true);

  // Outputs
  createPost = output<void>();
  viewAll = output<void>();
  viewPost = output<string>();
  hashtagClick = output<string>();

  // Public signals from service
  posts = this.feedService.posts;
  likedPosts = this.feedService.likedPosts;
  savedPosts = this.feedService.savedPosts;
  loading = this.feedService.loading;
  trendingHashtags = this.feedService.trendingHashtags;
  liveActivities = this.feedService.liveActivities;
  activityStats = this.feedService.activityStats;

  // Computed for display
  recentPosts = computed(() => {
    return this.posts()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, this.limit());
  });

  ngOnInit() {
    if (this.userId()) {
      this.loadFeed();
    }
  }

  loadFeed(): void {
    if (this.userId()) {
      this.feedService.loadFeedPosts(this.userId()!);
    }
  }

  isNewPost(post: any): boolean {
    const postTime = new Date(post.createdAt).getTime();
    const now = Date.now();
    return now - postTime < 5 * 60 * 1000; // 5 minutes
  }

  onLike(event: Event, post: any): void {
    event.stopPropagation();
    this.feedService.toggleLike(post._id).subscribe();
  }

  onSave(event: Event, postId: string): void {
    event.stopPropagation();
    this.feedService.toggleSave(postId).subscribe();
  }

  onShare(event: Event, post: any): void {
    event.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: `${post.author?.displayName || 'Community'} on MarketSpase`,
        text: post.content,
        url: `${window.location.origin}/dashboard/community/post/${post._id}`
      }).catch(() => {
        this.copyToClipboard(post._id);
      });
    } else {
      this.copyToClipboard(post._id);
    }
    
    this.feedService.sharePost(post._id).subscribe();
  }

  onPostClick(postId: string): void {
    this.viewPost.emit(postId);
  }

  onHashtagClick(event: Event, tag: string): void {
    event.stopPropagation();
    this.hashtagClick.emit(tag);
  }

  private copyToClipboard(postId: string): void {
    const url = `${window.location.origin}/dashboard/community/post/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
    });
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      like: 'favorite',
      comment: 'chat',
      post: 'post_add',
      earnings: 'emoji_events'
    };
    return icons[type] || 'notifications';
  }

  getBadgeTooltip(badge: string): string {
    const tips: Record<string, string> = {
      'top-promoter': 'Top 1% of promoters',
      'verified': 'Verified account',
      'rising-star': 'Fastest growing this month'
    };
    return tips[badge] || '';
  }
}