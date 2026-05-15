import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  Signal,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedPostCardComponent } from './feed-post-card/feed-post-card.component';
import { CommentDialogComponent } from './comment-dialog/comment-dialog.component';
import { CreatorSpotlightEntry, FeedPost, FeedService, ForumHighlight, ForumSpotlightEntry } from './feed.service';
import { ProfileService, SuggestedUser } from '../../profile/services/profile.service';
import { SkeletonLoaderComponent } from './shared/skeleton-loader/skeleton-loader.component';
import { UserInterface } from '@shared/services';

@Component({
  selector: 'app-feed-page-desktop',
  standalone: true,
  providers: [FeedService, ProfileService],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatInputModule,
    SkeletonLoaderComponent,
    FeedPostCardComponent
  ],
  templateUrl: './feed-page.component.html',
  styleUrls: ['./feed-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DesktopFeedPageComponent implements AfterViewInit {
  currentYear = new Date().getFullYear();

  private readonly feedService = inject(FeedService);
  private readonly profileService = inject(ProfileService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;

  private intersectionObserver: IntersectionObserver | null = null;
  private searchSubscription: any;
  private isLoadingMore = signal(false);

  posts = this.feedService.posts;
  likedPosts = this.feedService.likedPosts;
  savedPosts = this.feedService.savedPosts;
  loading = this.feedService.loading;
  hasMore = this.feedService.hasMore;
  trendingHashtags = this.feedService.trendingHashtags;
  trendingChallenges = this.feedService.trendingChallenges;
  creatorSpotlight = this.feedService.creatorSpotlight;
  forumHighlights = this.feedService.forumHighlights;
  hotTopics = this.feedService.hotTopics;
  forumSpotlight = this.feedService.forumSpotlight;
  featuredPost = this.feedService.featuredPost;
  activityStats = this.feedService.activityStats;

  suggestedUsers = this.profileService.suggestedUsers;
  following = signal<Set<string>>(new Set());

  selectedTab = signal<'for-you' | 'following' | 'trending' | 'latest'>('for-you');
  selectedType = signal<string>('all');
  searchQuery = signal<string>('');
  showFilters = signal<boolean>(false);

  filteredPosts = computed(() => this.posts() ?? []);
  regularPosts = computed(() => {
    const spotlightId = this.featuredPost()?._id;
    return this.filteredPosts().filter((post) => post._id !== spotlightId);
  });
  activeFeedMode = computed(() => {
    const tab = this.selectedTab();
    if (tab === 'following') return 'following';
    if (tab === 'trending') return 'trending';
    if (tab === 'latest') return 'latest';
    return 'for_you';
  });

  constructor() {
    effect(() => {
      const currentUser = this.user();
      const tab = this.selectedTab();
      const type = this.selectedType();

      if (!currentUser?._id) return;
      void tab;
      void type;

      queueMicrotask(() => {
        this.loadFeed(true);
        this.loadFollowingList();
      });
    });

    effect(() => {
      const error = this.feedService.error();
      if (!error) return;
      this.snackBar.open(error, 'Dismiss', {
        duration: 4000,
        panelClass: 'error-snackbar'
      });
    });

    this.searchSubscription = toObservable(this.searchQuery)
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        filter((query) => query.length === 0 || query.length > 2)
      )
      .subscribe(() => {
        if (!this.user()?._id) return;
        this.loadFeed(true);
      });
  }

  ngAfterViewInit(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.loading() && this.hasMore() && !this.isLoadingMore()) {
          this.loadMore();
        }
      },
      { threshold: 0.25, rootMargin: '120px' }
    );

    if (this.scrollAnchor?.nativeElement) {
      this.intersectionObserver.observe(this.scrollAnchor.nativeElement);
    }
  }

  loadFeed(reset: boolean = true): void {
    const currentUserId = this.user()?._id;
    if (!currentUserId) return;

    if (reset) {
      this.feedService.resetFeed();
    }

    this.feedService.loadFeedPosts(
      currentUserId,
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      this.searchQuery() || undefined,
      reset,
      this.activeFeedMode()
    );
  }

  loadMore(): void {
    const currentUserId = this.user()?._id;
    if (!currentUserId || this.loading() || !this.hasMore()) return;

    this.isLoadingMore.set(true);

    this.feedService.loadMoreFeedPosts(
      currentUserId,
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      this.searchQuery() || undefined,
      this.activeFeedMode()
    );

    setTimeout(() => this.isLoadingMore.set(false), 450);
  }

  onFilterChange(type: string): void {
    this.selectedType.set(type);
  }

  onSearch(query: string = ''): void {
    this.searchQuery.set(query);
  }

  onLike(post: FeedPost): void {
    this.feedService.toggleLike(post, this.user()?._id ?? '').subscribe();
  }

  onSave(postId: string): void {
    this.feedService.toggleSave(postId, this.user()?._id ?? '').subscribe();
  }

  onShare(post: FeedPost, platform: string = 'copy'): void {
    const shareUrl = `${window.location.origin}/feed/${post._id}`;
    const shareText = `${post.content}\n\nSee more on MarketSpase`;

    if (platform === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.snackBar.open('Link copied to clipboard', 'OK', { duration: 2200 });
      });
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank', 'noopener');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener');
    } else if (navigator.share) {
      navigator.share({
        title: `${post.author?.displayName || 'MarketSpase'} on MarketSpase`,
        text: post.content,
        url: shareUrl
      }).catch(() => null);
      platform = 'native';
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.snackBar.open('Link copied to clipboard', 'OK', { duration: 2200 });
      });
      platform = 'copy';
    }

    this.feedService.sharePost(post._id, this.user()?._id ?? '', platform).subscribe();
  }

  onChat(post: FeedPost): void {
    const phone = post.phone;
    if (!phone) {
      this.snackBar.open('No WhatsApp contact is available for this post yet.', 'Dismiss', { duration: 2600 });
      return;
    }

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent('Hello, I found your post on MarketSpase and I would like to learn more.')}`,
      '_blank',
      'noopener'
    );

    this.feedService.trackChatClick(post._id, this.user()?._id ?? undefined).subscribe({
      error: () => null
    });
  }

  onComment(postId: string): void {
    this.dialog.open(CommentDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      panelClass: 'comment-dialog-panel',
      disableClose: true,
      data: { postId }
    });
  }

  onCreatePost(): void {
    this.router.navigate(['/dashboard/community/feeds/create']);
  }

  onHashtagClick(hashtag: string): void {
    this.searchQuery.set(hashtag);
    this.selectedTab.set('trending');
  }

  onOpenChallenge(tag: string): void {
    this.searchQuery.set(tag);
    this.selectedTab.set('trending');
    this.loadFeed(true);
  }

  onRefresh(): void {
    this.loadFeed(true);
  }

  openForumHome(): void {
    this.router.navigate(['/dashboard/community/discussion']);
  }

  openForumThread(threadId: string): void {
    if (!threadId) return;
    this.router.navigate(['/dashboard/community/discussion', threadId]);
  }

  openForumTopic(topic: string): void {
    if (!topic) return;
    this.router.navigate(['/dashboard/community/discussion'], {
      queryParams: { tag: topic }
    });
  }

  isFollowing(userId: string): boolean {
    return this.following().has(userId);
  }

  toggleFollow(userId: string): void {
    const currentUserId = this.user()?._id;
    if (!currentUserId) return;

    this.profileService.toggleFollow(userId, currentUserId).subscribe({
      next: (res) => {
        this.following.update((set) => {
          const next = new Set(set);
          if (res.followed) {
            next.add(userId);
          } else {
            next.delete(userId);
          }
          return next;
        });
      },
      error: () => {
        this.snackBar.open('Action failed', 'Dismiss', { duration: 2800 });
      }
    });
  }

  loadFollowingList(): void {
    const currentUserId = this.user()?._id;
    if (!currentUserId) return;

    this.profileService.getFollowing(currentUserId, 1, 100).subscribe({
      next: (res) => {
        const followingIds = (res.following || []).map((entry: any) => entry._id);
        this.following.set(new Set(followingIds));
      },
      error: () => null
    });
  }

  viewProfile(user: SuggestedUser | CreatorSpotlightEntry): void {
    this.router.navigate(['/dashboard/profile', user._id]);
  }

  viewForumSpotlightProfile(user: ForumSpotlightEntry): void {
    this.router.navigate(['/dashboard/profile', user._id]);
  }

  trackForumThread(index: number, thread: ForumHighlight): string {
    return thread._id;
  }

  formatThreadTime(date: string): string {
    return this.feedService.formatTime(date);
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe?.();
    this.intersectionObserver?.disconnect?.();
  }
}
