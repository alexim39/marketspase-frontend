import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnDestroy,
  QueryList,
  Signal,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subscription, debounceTime, distinctUntilChanged, filter, switchMap, timer } from 'rxjs';

import { FeedPost, FeedService, LiveActivity } from './../feed.service';
import { CommentDialogComponent } from './../comment-dialog/comment-dialog.component';
import { UserInterface } from '@shared/services';
import { ProfileService } from '../../../profile/services/profile.service';
import { FeedLiveActivityToastComponent } from '../shared/feed-live-activity-toast/feed-live-activity-toast.component';

type MobileFeedTab = 'for-you' | 'following';
type FeedMedia = NonNullable<FeedPost['media']>[number];
type SharePlatform = 'native' | 'copy' | 'whatsapp' | 'facebook' | 'x';

@Component({
  selector: 'app-feed-page-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    FeedLiveActivityToastComponent
  ],
  templateUrl: './feed-page-mobile.component.html',
  styleUrls: ['./feed-page-mobile.component.scss'],
  providers: [FeedService, ProfileService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MobileFeedComponent implements AfterViewInit, OnDestroy {
  private readonly feedService = inject(FeedService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly profileService = inject(ProfileService);
  private readonly destroyRef = inject(DestroyRef);
  public readonly router = inject(Router);

  @Input({ required: true }) user!: Signal<UserInterface | null>;

  @ViewChild('scrollContainer') scrollContainer!: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef<HTMLElement>;
  @ViewChildren('postPanel') postPanels!: QueryList<ElementRef<HTMLElement>>;

  readonly posts = this.feedService.posts;
  readonly likedPosts = this.feedService.likedPosts;
  readonly savedPosts = this.feedService.savedPosts;
  readonly loading = this.feedService.loading;
  readonly hasMore = this.feedService.hasMore;
  readonly trendingHashtags = this.feedService.trendingHashtags;
  readonly trendingChallenges = this.feedService.trendingChallenges;
  readonly creatorSpotlight = this.feedService.creatorSpotlight;
  readonly liveActivities = this.feedService.liveActivities;
  readonly featuredPost = this.feedService.featuredPost;

  readonly selectedTab = signal<MobileFeedTab>('for-you');
  readonly selectedType = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly following = signal<Set<string>>(new Set());

  readonly activePostId = signal<string | null>(null);
  readonly activePostIndex = signal(0);
  readonly videoMutedState = signal<Map<string, boolean>>(new Map());
  readonly expandedCaptions = signal<Set<string>>(new Set());
  readonly heartBursts = signal<Set<string>>(new Set());
  readonly shareSheetPost = signal<FeedPost | null>(null);
  readonly moreSheetPost = signal<FeedPost | null>(null);
  readonly copiedPostId = signal<string | null>(null);
  readonly pullDistance = signal(0);
  readonly isPulling = signal(false);
  readonly isRefreshing = signal(false);

  readonly regularPosts = computed(() => this.posts() ?? []);
  readonly activeFeedTitle = computed(() => this.selectedTab() === 'following' ? 'Following' : 'For You');
  readonly pullProgress = computed(() => Math.min(1, this.pullDistance() / 86));
  readonly isSheetOpen = computed(() => Boolean(this.shareSheetPost() || this.moreSheetPost()));

  private searchSubscription: any;
  private liveActivitySubscription?: Subscription;
  private intersectionObserver: IntersectionObserver | null = null;
  private visibilityObserver: IntersectionObserver | null = null;
  private touchStartY = 0;
  private singleTapTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTapAt = 0;
  private lastTapPostId = '';
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const currentUser = this.user();
      if (!currentUser?._id) return;
      queueMicrotask(() => this.loadFollowingList());
    });

    effect(() => {
      const error = this.feedService.error();
      if (error) {
        this.snackBar.open(error, 'Dismiss', { duration: 5000 });
      }
    });

    this.searchSubscription = toObservable(this.searchQuery)
      .pipe(
        debounceTime(420),
        distinctUntilChanged(),
        filter((query) => query.length === 0 || query.length > 2)
      )
      .subscribe((query) => {
        if (!this.user()?._id) return;
        this.loadFeedWithSearch(query);
      });

    effect(() => {
      const currentUser = this.user();
      const tab = this.selectedTab();
      const type = this.selectedType();
      if (!currentUser?._id) return;
      void tab;
      void type;

      queueMicrotask(() => {
        this.loadFeed(true);
        this.startLiveActivityPolling();
      });
    });
  }

  ngAfterViewInit(): void {
    this.setupInfiniteScroll();
    this.setupPostVisibility();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.intersectionObserver?.disconnect();
    this.visibilityObserver?.disconnect();
    this.liveActivitySubscription?.unsubscribe();
    this.clearLongPressTimer();
    if (this.singleTapTimer) clearTimeout(this.singleTapTimer);
  }

  private setupInfiniteScroll(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.loading() && this.hasMore()) {
          this.loadMore();
        }
      },
      {
        root: this.scrollContainer?.nativeElement ?? null,
        threshold: 0.1,
        rootMargin: '260px 0px'
      }
    );

    if (this.scrollAnchor?.nativeElement) {
      this.intersectionObserver.observe(this.scrollAnchor.nativeElement);
    }
  }

  private setupPostVisibility(): void {
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const panel = entry.target as HTMLElement;
          const video = panel.querySelector('video') as HTMLVideoElement | null;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.62) {
            const postId = panel.dataset['postId'] || null;
            const index = Number(panel.dataset['index'] || 0);
            this.activePostId.set(postId);
            this.activePostIndex.set(index);
            if (video && postId) {
              this.playVisibleVideo(video, postId);
            }
            return;
          }

          if (!entry.isIntersecting || entry.intersectionRatio < 0.28) {
            video?.pause();
          }
        });
      },
      {
        root: this.scrollContainer?.nativeElement ?? null,
        threshold: [0, 0.28, 0.62, 0.88]
      }
    );

    const observePanels = () => {
      this.visibilityObserver?.disconnect();
      this.postPanels?.forEach((panelRef) => this.visibilityObserver?.observe(panelRef.nativeElement));
    };

    queueMicrotask(observePanels);
    this.postPanels.changes.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(observePanels);
  }

  private playVisibleVideo(video: HTMLVideoElement, postId: string): void {
    video.muted = this.isVideoMuted(postId);
    const playRequest = video.play();
    if (!playRequest) return;

    playRequest.catch(() => {
      this.setVideoMuted(postId, true);
      video.muted = true;
      video.play().catch(() => null);
    });
  }

  private loadFeedWithSearch(searchTerm: string): void {
    this.feedService.loadFeedPosts(
      this.user()?._id ?? '',
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      searchTerm || undefined,
      true,
      this.selectedTab() === 'following' ? 'following' : 'for_you',
      8
    );
  }

  loadFeed(reset: boolean = true): void {
    const currentUserId = this.user()?._id;
    if (!currentUserId) return;

    if (reset) {
      this.activePostIndex.set(0);
      this.activePostId.set(null);
    }

    this.feedService.loadFeedPosts(
      currentUserId,
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      this.searchQuery() || undefined,
      reset,
      this.selectedTab() === 'following' ? 'following' : 'for_you',
      8
    );
  }

  loadMore(): void {
    if (this.loading() || !this.hasMore()) return;
    const currentUserId = this.user()?._id;
    if (!currentUserId) return;

    this.feedService.loadFeedPosts(
      currentUserId,
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      this.searchQuery() || undefined,
      false,
      this.selectedTab() === 'following' ? 'following' : 'for_you',
      8
    );
  }

  refreshFeed(): void {
    if (this.isRefreshing()) return;
    this.isRefreshing.set(true);
    this.loadFeed(true);
    this.feedService.loadLiveActivityFeed(6).subscribe();
    setTimeout(() => this.isRefreshing.set(false), 900);
  }

  onTouchStart(event: TouchEvent): void {
    if (this.scrollContainer?.nativeElement.scrollTop > 0) return;
    this.touchStartY = event.touches[0]?.clientY ?? 0;
    this.isPulling.set(true);
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isPulling()) return;
    const currentY = event.touches[0]?.clientY ?? 0;
    const distance = currentY - this.touchStartY;
    if (distance <= 0 || this.scrollContainer?.nativeElement.scrollTop > 0) return;
    this.pullDistance.set(Math.min(112, distance));
  }

  onTouchEnd(): void {
    if (this.pullDistance() >= 76) {
      this.refreshFeed();
    }
    this.isPulling.set(false);
    this.pullDistance.set(0);
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

  openShareSheet(post: FeedPost, event?: Event): void {
    event?.stopPropagation();
    this.shareSheetPost.set(post);
  }

  closeShareSheet(): void {
    this.shareSheetPost.set(null);
  }

  shareTo(platform: SharePlatform): void {
    const post = this.shareSheetPost();
    if (!post) return;
    const shareUrl = this.buildShareUrl(post);
    const shareText = `${post.content || 'See this MarketSpase post'}\n${shareUrl}`;
    let trackedPlatform = platform;

    if (platform === 'native' && typeof navigator.share === 'function') {
      navigator.share({
        title: `${post.author?.displayName || 'MarketSpase'} on MarketSpase`,
        text: post.content,
        url: shareUrl
      }).catch(() => null);
    } else if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
    } else {
      this.copyText(shareUrl, 'Post link copied');
      trackedPlatform = 'copy';
    }

    this.feedService.sharePost(post._id, this.user()?._id ?? '', trackedPlatform).subscribe();
    this.closeShareSheet();
  }

  onComment(postId: string, event?: Event): void {
    event?.stopPropagation();
    this.dialog.open(CommentDialogComponent, {
      width: '100vw',
      maxWidth: '100vw',
      height: 'min(82dvh, 720px)',
      maxHeight: '82dvh',
      position: { bottom: '0' },
      panelClass: ['mobile-community-bottom-sheet', 'mobile-comment-bottom-sheet'],
      backdropClass: 'mobile-community-sheet-backdrop',
      autoFocus: false,
      restoreFocus: false,
      data: { postId }
    });
  }

  onCreatePost(): void {
    this.router.navigate(['/dashboard/community/feeds/create']);
  }

  onHashtagClick(hashtag: string, event?: Event): void {
    event?.stopPropagation();
    this.searchQuery.set(hashtag);
    this.selectedTab.set('for-you');
  }

  isFollowing(userId: string): boolean {
    return this.following().has(userId);
  }

  toggleFollow(userId: string, event?: Event): void {
    event?.stopPropagation();
    const currentUserId = this.user()?._id;
    if (!currentUserId || !userId) return;

    const wasFollowing = this.following().has(userId);
    this.following.update((set) => {
      const next = new Set(set);
      wasFollowing ? next.delete(userId) : next.add(userId);
      return next;
    });

    this.profileService.toggleFollow(userId, currentUserId).subscribe({
      next: (res) => {
        this.snackBar.open(res.followed ? 'Following creator' : 'Unfollowed creator', 'OK', { duration: 1800 });
      },
      error: () => {
        this.following.update((set) => {
          const next = new Set(set);
          wasFollowing ? next.add(userId) : next.delete(userId);
          return next;
        });
        this.snackBar.open('Action failed', 'Dismiss', { duration: 3000 });
      }
    });
  }

  loadFollowingList(): void {
    const currentUserId = this.user()?._id;
    if (!currentUserId) return;

    this.profileService.getFollowing(currentUserId, 1, 100).subscribe({
      next: (res) => {
        const followingIds = (res.following || []).map((u: any) => u._id);
        this.following.set(new Set(followingIds));
      },
      error: () => null
    });
  }

  navigateTo(route: string): void {
    switch (route) {
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

  onLiveActivityClick(activity: LiveActivity): void {
    if (activity.actionUrl) {
      this.router.navigateByUrl(activity.actionUrl);
      return;
    }

    if (activity.postId) {
      this.router.navigateByUrl(`/feed/${activity.postId}`);
      return;
    }

    if (activity.authorId) {
      this.router.navigate(['/dashboard/profile', activity.authorId]);
    }
  }

  openLink(url: string, event?: Event): void {
    event?.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  onMediaTap(event: Event, post: FeedPost, video?: HTMLVideoElement): void {
    const now = Date.now();
    const isDoubleTap = this.lastTapPostId === post._id && now - this.lastTapAt < 290;

    if (isDoubleTap) {
      if (this.singleTapTimer) {
        clearTimeout(this.singleTapTimer);
        this.singleTapTimer = null;
      }
      this.triggerHeart(post._id);
      if (!this.likedPosts().has(post._id)) {
        this.onLike(post);
      }
      this.lastTapAt = 0;
      this.lastTapPostId = '';
      return;
    }

    this.lastTapAt = now;
    this.lastTapPostId = post._id;

    if (video) {
      this.singleTapTimer = setTimeout(() => this.togglePlayPause(event, video), 220);
    }
  }

  togglePlayPause(event: Event, video: HTMLVideoElement): void {
    event.stopPropagation();
    if (video.paused) {
      video.play().catch(() => null);
    } else {
      video.pause();
    }
  }

  toggleMute(postId: string, event?: Event): void {
    event?.stopPropagation();
    const nextMuted = !this.isVideoMuted(postId);
    this.setVideoMuted(postId, nextMuted);

    const video = this.scrollContainer?.nativeElement.querySelector<HTMLVideoElement>(`video[data-post-id="${postId}"]`);
    if (video) {
      video.muted = nextMuted;
      if (!nextMuted) {
        video.play().catch(() => {
          this.setVideoMuted(postId, true);
          video.muted = true;
        });
      }
    }
  }

  isVideoMuted(postId: string): boolean {
    return this.videoMutedState().get(postId) ?? false;
  }

  private setVideoMuted(postId: string, muted: boolean): void {
    this.videoMutedState.update((map) => {
      const next = new Map(map);
      next.set(postId, muted);
      return next;
    });
  }

  private startLiveActivityPolling(): void {
    if (this.liveActivitySubscription) {
      return;
    }

    this.liveActivitySubscription = timer(0, 60000)
      .pipe(switchMap(() => this.feedService.loadLiveActivityFeed(6)))
      .subscribe();
  }

  toggleCaption(postId: string, event?: Event): void {
    event?.stopPropagation();
    this.expandedCaptions.update((set) => {
      const next = new Set(set);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  }

  isCaptionExpanded(postId: string): boolean {
    return this.expandedCaptions().has(postId);
  }

  onLongPressStart(event: PointerEvent, post: FeedPost): void {
    if (event.pointerType === 'mouse') return;
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => this.openMoreSheet(post), 560);
  }

  onLongPressEnd(): void {
    this.clearLongPressTimer();
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  openMoreSheet(post: FeedPost, event?: Event): void {
    event?.stopPropagation();
    this.moreSheetPost.set(post);
  }

  closeMoreSheet(): void {
    this.moreSheetPost.set(null);
  }

  openWhatsApp(post: FeedPost, event?: Event): void {
    event?.stopPropagation();
    const phone = post.phone;
    if (!phone) {
      this.snackBar.open('No contact number available', 'OK', { duration: 2200 });
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent('Hello, I found your post on MarketSpase and I would like to learn more.')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    this.feedService.trackChatClick(post._id, this.user()?._id ?? undefined).subscribe({
      error: () => null
    });
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
        this.closeMoreSheet();
        this.snackBar.open('Post deleted successfully', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to delete post', 'OK', { duration: 2200 });
      }
    });
  }

  onEdit(post: FeedPost): void {
    this.closeMoreSheet();
    this.router.navigate(['/dashboard/community/feeds/edit', post._id]);
  }

  viewProfile(userId: string | undefined | null, event?: Event): void {
    event?.stopPropagation();
    if (!userId) return;
    this.router.navigate(['/dashboard/profile', userId]);
  }

  activeMedia(post: FeedPost): FeedMedia | null {
    return post.media?.[0] || null;
  }

  isVideo(post: FeedPost): boolean {
    return this.activeMedia(post)?.type === 'video';
  }

  tagLabel(tag: string | { tag: string }): string {
    return typeof tag === 'string' ? tag : tag?.tag || '';
  }

  captionText(post: FeedPost): string {
    const content = post.content || '';
    if (this.isCaptionExpanded(post._id) || content.length <= 118) return content;
    return `${content.slice(0, 118).trim()}...`;
  }

  shouldShowReadMore(post: FeedPost): boolean {
    return (post.content || '').length > 118;
  }

  mediaAlt(post: FeedPost): string {
    const media = this.activeMedia(post);
    return media?.altText || `Post from ${post.author?.displayName || post.author?.username || 'MarketSpase creator'}`;
  }

  shouldPreloadMedia(index: number): boolean {
    const active = this.activePostIndex();
    return index >= active - 1 && index <= active + 3;
  }

  isPromotional(post: FeedPost): boolean {
    return Boolean(post.product?.productId || post.campaign?.campaignId);
  }

  openProduct(post: FeedPost, event?: Event): void {
    event?.stopPropagation();
    const productId = post.product?.productId;
    if (!productId) return;
    this.router.navigate(['/product', productId], {
      queryParams: { source: 'community-feed' }
    });
  }

  promotePost(post: FeedPost, event?: Event): void {
    event?.stopPropagation();

    if (post.product?.productId) {
      this.router.navigate(['/dashboard/stores/product', post.product.productId]);
      return;
    }

    if (post.campaign?.campaignId) {
      this.router.navigate(['/dashboard/campaigns', post.campaign.campaignId]);
      return;
    }

    this.snackBar.open('Promotion details are not available for this post yet.', 'OK', { duration: 2400 });
  }

  copyProductLink(post: FeedPost, event?: Event): void {
    event?.stopPropagation();
    const productUrl = post.product?.productUrl || (post.product?.productId ? `${window.location.origin}/product/${post.product.productId}` : '');
    if (!productUrl) {
      this.snackBar.open('No product link available', 'OK', { duration: 2200 });
      return;
    }
    this.copyText(productUrl, 'Product link copied');
    this.copiedPostId.set(post._id);
    setTimeout(() => this.copiedPostId.set(null), 1300);
  }

  canNativeShare(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  }

  productPrice(post: FeedPost): string {
    const price = post.product?.price;
    if (price === undefined || price === null) return '';
    const currency = post.product?.currency || 'NGN';
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(price);
    } catch {
      return `${currency} ${Number(price).toLocaleString('en-NG')}`;
    }
  }

  formatCount(value: number | undefined | null): string {
    const count = Number(value || 0);
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(count >= 10_000_000 ? 0 : 1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(count >= 10_000 ? 0 : 1)}K`;
    return `${count}`;
  }

  formatTime(dateString: string): string {
    return this.feedService.formatTime(dateString);
  }

  trackPost = (_: number, post: FeedPost) => post._id;

  private triggerHeart(postId: string): void {
    this.heartBursts.update((set) => new Set(set).add(postId));
    setTimeout(() => {
      this.heartBursts.update((set) => {
        const next = new Set(set);
        next.delete(postId);
        return next;
      });
    }, 780);
  }

  private buildShareUrl(post: FeedPost): string {
    return `${window.location.origin}/feed/${post._id}`;
  }

  private copyText(text: string, message: string): void {
    const fallback = () => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => this.snackBar.open(message, 'OK', { duration: 1900 }))
        .catch(() => {
          fallback();
          this.snackBar.open(message, 'OK', { duration: 1900 });
        });
      return;
    }

    fallback();
    this.snackBar.open(message, 'OK', { duration: 1900 });
  }
}
