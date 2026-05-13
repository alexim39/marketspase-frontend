// community-feed.component.ts - Add media state and methods

import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { FeedPost, FeedService, LiveActivity } from '../../../../community/feeds/feed.service';
@Component({
  selector: 'community-feed',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './community-feed.component.html',
  styleUrls: ['./community-feed.component.scss']
})
export class CommunityFeedComponent {
  protected feedService = inject(FeedService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

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

  // Media state
  expandedMedia = signal<{postId: string, mediaIndex: number} | null>(null);
  playingVideos = signal<Set<string>>(new Set());

  // Computed for display
  recentPosts = computed(() => {
    return this.posts()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, this.limit());
  });

  onLike(event: Event, post: FeedPost): void {
    event.stopPropagation();
    this.feedService.toggleLike(post, this.userId() ?? '').subscribe();
  }

  onSave(event: Event, postId: string): void {
    event.stopPropagation();
    this.feedService.toggleSave(postId, this.userId() ?? '').subscribe();
  }

  onShare(event: Event, post: FeedPost): void {
    event.stopPropagation();
    
    if (navigator.share) {
      navigator.share({
        title: `${post.author?.displayName || 'Community'} on MarketSpase`,
        text: post.content,
        url: `${window.location.origin}/feed/${post._id}`
      }).catch(() => {
        this.copyToClipboard(post._id);
      });
    } else {
      this.copyToClipboard(post._id);
    }
    
    this.feedService.sharePost(post._id, this.userId() ?? '').subscribe();
  }

  onPostClick(postId: string): void {
    this.viewPost.emit(postId);
  }

  onLiveActivityClick(activity: LiveActivity): void {
    if (activity.postId) {
      this.onPostClick(activity.postId);
      return;
    }

    if (activity.actionUrl) {
      this.router.navigateByUrl(activity.actionUrl);
      return;
    }

    if (activity.authorId) {
      this.router.navigate(['/dashboard/profile', activity.authorId]);
    }
  }

  onHashtagClick(event: Event, tag: string): void {
    event.stopPropagation();
    this.hashtagClick.emit(tag);
  }

  private copyToClipboard(postId: string): void {
    const url = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
    });
  }

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      like: 'favorite',
      comment: 'chat',
      post: 'post_add',
      earnings: 'emoji_events',
      forum: 'forum',
      campaign: 'campaign',
      product: 'inventory_2'
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
  
  // ========== MEDIA HANDLING METHODS ==========
  
  /**
   * Toggle image expansion
   */
  toggleImage(postId: string, mediaIndex: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    const current = this.expandedMedia();
    if (current && current.postId === postId && current.mediaIndex === mediaIndex) {
      this.expandedMedia.set(null); // Collapse
    } else {
      this.expandedMedia.set({ postId, mediaIndex }); // Expand
    }
  }
  
  /**
   * Play video inline
   */
  playVideo(postId: string, media: any, event: Event): void {
    event.stopPropagation();
    
    const playing = this.playingVideos();
    if (playing.has(postId)) {
      playing.delete(postId);
    } else {
      playing.add(postId);
    }
    this.playingVideos.set(new Set(playing));
  }
  
  /**
   * Check if video is playing for a post
   */
  isVideoPlaying(postId: string): boolean {
    return this.playingVideos().has(postId);
  }
  
  /**
   * Get safe video URL
   */
  getSafeVideoUrl(url: string): SafeResourceUrl {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
      const videoId = this.extractYouTubeId(url);
      if (videoId) {
        url = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    }
    // Convert Vimeo URLs
    else if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      if (videoId) {
        url = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
      }
    }
    
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  /**
   * Extract YouTube video ID from URL
   */
  private extractYouTubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  /**
   * Open link in new tab
   */
  openLink(url: string, event: Event): void {
    event.stopPropagation();
    window.open(url, '_blank');
  }
  
  /**
   * Navigate to next/previous image in expanded view
   */
  navigateMedia(direction: 'next' | 'prev', post: any, event: Event): void {
    event.stopPropagation();
    
    const current = this.expandedMedia();
    if (!current || !post.media) return;
    
    const totalMedia = post.media.length;
    let newIndex = current.mediaIndex;
    
    if (direction === 'next') {
      newIndex = (current.mediaIndex + 1) % totalMedia;
    } else {
      newIndex = (current.mediaIndex - 1 + totalMedia) % totalMedia;
    }
    
    this.expandedMedia.set({ postId: post._id, mediaIndex: newIndex });
  }
  
  /**
   * Close expanded media
   */
  closeExpandedMedia(event: Event): void {
    event.stopPropagation();
    this.expandedMedia.set(null);
  }

  isNewPost(post: FeedPost): boolean {
    const postTime = new Date(post.createdAt).getTime();
    const now = Date.now();
    return now - postTime < 5 * 60 * 1000; // 5 minutes
  }

  getHashtagValue(tag: string | { tag: string }): string {
    return typeof tag === 'string' ? tag : tag?.tag || '';
  }
}
