import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
  Input,
  Signal,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';

import { FeedService, FeedPost } from './../feed.service';
import { CommentDialogComponent } from './../comment-dialog/comment-dialog.component';
import { UserInterface } from '../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-feed-page-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './feed-page-mobile.component.html',
  styleUrls: ['./feed-page-mobile.component.scss'],
  providers: [FeedService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileFeedComponent implements OnInit, AfterViewInit, OnDestroy {
  private feedService = inject(FeedService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public router = inject(Router);

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLElement>;
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;

  // Feed service signals
  posts = this.feedService.posts;
  likedPosts = this.feedService.likedPosts;
  savedPosts = this.feedService.savedPosts;
  loading = this.feedService.loading;
  hasMore = this.feedService.hasMore;
  trendingHashtags = this.feedService.trendingHashtags;
  featuredPost = this.feedService.featuredPost;

  // UI state
  selectedTab = signal<'for-you' | 'following'>('for-you');
  selectedType = signal<string>('all');
  searchQuery = signal<string>('');

  // Following set
  following = signal<Set<string>>(new Set());

  videoMutedState = signal<Map<string, boolean>>(new Map());

  captionVisible = signal<Map<string, boolean>>(new Map());

  // Helper to get muted state for a post
isVideoMuted(postId: string): boolean {
  return this.videoMutedState().get(postId) ?? true; // default muted
}

// Helper to check if caption is visible for a post
isCaptionVisible(postId: string): boolean {
  return this.captionVisible().get(postId) ?? false;
}

  // Computed posts
  regularPosts = computed(() => this.posts() ?? []);

  private searchSubscription: any;
  private intersectionObserver!: IntersectionObserver;
  private visibilityObserver!: IntersectionObserver;

  constructor() {
    // Load feed when user or tab changes
    effect(() => {
      const currentUser = this.user();
      const tab = this.selectedTab();
      if (!currentUser?._id) return;

      queueMicrotask(() => {
        this.loadFeed();
      });
    });

    // Show errors
    effect(() => {
      const error = this.feedService.error();
      if (error) {
        this.snackBar.open(error, 'Dismiss', { duration: 5000 });
      }
    });

    // Debounced search
    this.searchSubscription = toObservable(this.searchQuery)
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter(q => q.length === 0 || q.length > 2)
      )
      .subscribe(query => {
        const currentUser = this.user();
        if (!currentUser?._id) return;
        this.loadFeedWithSearch(query);
      });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.setupInfiniteScroll();
    this.setupVideoVisibility();
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
    this.intersectionObserver?.disconnect();
    this.visibilityObserver?.disconnect();
  }

  private setupInfiniteScroll() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.loading() && this.hasMore()) {
          this.loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (this.scrollAnchor) {
      this.intersectionObserver.observe(this.scrollAnchor.nativeElement);
    }
  }

  private setupVideoVisibility() {
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            // Play video when it becomes visible
            video.play().catch(() => {}); // Autoplay may be prevented; ignore
          } else {
            // Pause when scrolled out
            video.pause();
          }
        });
      },
      { threshold: 0.6 } // Play when at least 60% visible
    );

    // Observe videos after they're rendered
    this.videoPlayers.changes.subscribe(() => {
      this.videoPlayers.forEach(videoRef => {
        this.visibilityObserver.observe(videoRef.nativeElement);
      });
    });
  }

  private loadFeedWithSearch(searchTerm: string): void {
    this.feedService.loadFeedPosts(
      this.user()?._id ?? '',
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      searchTerm || undefined,
      true
    );
  }

  loadFeed(): void {
    this.feedService.loadFeedPosts(
      this.user()?._id ?? '',
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      undefined,
      true
    );
  }

  loadMore(): void {
    if (!this.loading() && this.hasMore()) {
      this.feedService.loadFeedPosts(
        this.user()?._id ?? '',
        this.selectedType() !== 'all' ? this.selectedType() : undefined,
        undefined,
        undefined,
        false
      );
    }
  }

  onSearch(): void {
    this.router.navigate(['/dashboard/search']);
  }

  onLike(post: FeedPost): void {
    this.feedService.toggleLike(post, this.user()?._id ?? '').subscribe();
  }

  onSave(postId: string): void {
    this.feedService.toggleSave(postId, this.user()?._id ?? '').subscribe();
  }

  onShare(post: FeedPost): void {
    if (navigator.share) {
      navigator.share({
        title: `${post.author?.displayName} on MarketSpase`,
        text: post.content,
        url: `${window.location.origin}/feed/${post._id}`
      }).catch(() => this.copyToClipboard(post._id));
    } else {
      this.copyToClipboard(post._id);
    }
    this.feedService.sharePost(post._id, this.user()?._id ?? '').subscribe();
  }

  private copyToClipboard(postId: string): void {
    const url = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied!', 'OK', { duration: 2000 });
    });
  }

  onComment(postId: string): void {
    this.dialog.open(CommentDialogComponent, {
      width: '100%',
      maxWidth: '100vw',
      height: '100%',
      panelClass: 'full-screen-dialog',
      disableClose: true,
      data: { postId }
    });
  }

  onCreatePost(): void {
    this.router.navigate(['/dashboard/community/feeds/create']);
  }

  onHashtagClick(hashtag: string): void {
    this.searchQuery.set(hashtag);
    this.selectedTab.set('for-you');
  }

  isFollowing(userId: string): boolean {
    return this.following().has(userId);
  }

  toggleFollow(userId: string): void {
    const following = new Set(this.following());
    if (following.has(userId)) {
      following.delete(userId);
      this.snackBar.open('Unfollowed', 'OK', { duration: 2000 });
    } else {
      following.add(userId);
      this.snackBar.open('Following', 'OK', { duration: 2000 });
    }
    this.following.set(following);
  }

  navigateTo(route: string): void {
    switch(route) {
      case 'explore':
        this.router.navigate(['/dashboard/explore']);
        break;
      case 'notifications':
        this.router.navigate(['/dashboard/notifications']);
        break;
      case 'profile':
        this.router.navigate(['/dashboard/profile', this.user()?._id]);
        break;
      default:
        this.selectedTab.set('for-you');
    }
  }

  onNotifications(): void {
    this.router.navigate(['/dashboard/notifications']);
  }

  openLink(url: string): void {
    window.open(url, '_blank');
  }

  // Video controls
  togglePlayPause(event: Event, video: HTMLVideoElement): void {
    event.stopPropagation();
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  toggleMute(postId: string): void {
    const videoRef = this.videoPlayers.find(ref =>
        ref.nativeElement.closest('[data-post-id]')?.getAttribute('data-post-id') === postId
    );
    if (videoRef) {
        const video = videoRef.nativeElement;
        video.muted = !video.muted;
        // Update state
        this.videoMutedState.update(map => {
        map.set(postId, video.muted);
        return new Map(map);
        });
    }
  }

  // Toggle caption visibility
    toggleCaption(postId: string): void {
    this.captionVisible.update(map => {
        const current = map.get(postId) ?? false;
        map.set(postId, !current);
        return new Map(map);
    });
    }

    // Open WhatsApp chat (example – you can adjust the link structure)
    openWhatsApp(post: FeedPost): void {
      // Assuming the post has a contact number or WhatsApp link
      // e.g., post.campaign?.contactWhatsapp or post.author?.phone
      const phone = post.phone;
      if (phone) {
          const url = `https://wa.me/${post.phone}`;
          window.open(url, '_blank');
      } else {
          this.snackBar.open('No contact number available', 'OK', { duration: 2000 });
      }
    }
}