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
import { Subscription, debounceTime, distinctUntilChanged, filter, finalize, switchMap, timer } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FeedPostCardComponent } from './feed-post-card/feed-post-card.component';
import { CreatorSpotlightEntry, FeedComment, FeedPost, FeedService, ForumHighlight, ForumSpotlightEntry, LiveActivity } from './feed.service';
import { ProfileService, SuggestedUser } from '../../profile/services/profile.service';
import { UserInterface } from '@shared/services';
import { FeedLiveActivityToastComponent } from './shared/feed-live-activity-toast/feed-live-activity-toast.component';

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
    MatTooltipModule,
    MatBadgeModule,
    MatDividerModule,
    MatInputModule,
    FeedPostCardComponent,
    FeedLiveActivityToastComponent
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
  private readonly router = inject(Router);

  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;

  private intersectionObserver: IntersectionObserver | null = null;
  private searchSubscription: any;
  private liveActivitySubscription?: Subscription;
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
  liveActivities = this.feedService.liveActivities;
  featuredPost = this.feedService.featuredPost;
  activityStats = this.feedService.activityStats;

  suggestedUsers = this.profileService.suggestedUsers;
  following = signal<Set<string>>(new Set());

  selectedTab = signal<'for-you' | 'following' | 'trending' | 'latest' | 'saved'>('for-you');
  selectedType = signal<string>('all');
  searchQuery = signal<string>('');
  showFilters = signal<boolean>(false);
  activeCommentPostId = signal<string | null>(null);
  commentRailOpen = signal(false);
  comments = signal<FeedComment[]>([]);
  commentsLoading = signal(false);
  commentsLoadingMore = signal(false);
  commentsSubmitting = signal(false);
  commentsHasMore = signal(false);
  commentsPage = signal(1);
  commentDraft = signal('');
  replyDraft = signal('');
  replyingTo = signal<FeedComment | null>(null);

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
    if (tab === 'saved') return 'saved';
    return 'for_you';
  });
  activeCommentPost = computed(() => {
    const activeId = this.activeCommentPostId();
    if (!activeId) return null;
    const featured = this.featuredPost();
    if (featured?._id === activeId) return featured;
    const posts = this.filteredPosts();
    return posts.find((post) => post._id === activeId) || null;
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
        this.startLiveActivityPolling();
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

    effect(() => {
      const posts = this.filteredPosts();
      const featured = this.featuredPost();
      const currentId = this.activeCommentPostId();
      if (!currentId) return;

      const currentStillExists = posts.some((post) => post._id === currentId) || featured?._id === currentId;
      if (!posts.length || !currentStillExists) {
        queueMicrotask(() => this.closeCommentRail());
      }
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
    this.openInlineComments(postId);
  }

  openInlineComments(postId: string): void {
    if (!postId) return;
    const samePost = this.activeCommentPostId() === postId;
    this.activeCommentPostId.set(postId);
    this.commentRailOpen.set(true);
    this.replyingTo.set(null);
    this.replyDraft.set('');

    if (samePost && (this.commentsLoading() || this.commentsLoadingMore())) {
      return;
    }

    if (samePost && this.comments().length > 0) {
      return;
    }

    this.loadComments(1, true);
  }

  closeCommentRail(): void {
    this.commentRailOpen.set(false);
    this.activeCommentPostId.set(null);
    this.comments.set([]);
    this.commentsHasMore.set(false);
    this.commentsPage.set(1);
    this.commentDraft.set('');
    this.replyDraft.set('');
    this.replyingTo.set(null);
  }

  loadComments(page: number = 1, reset: boolean = false): void {
    const postId = this.activeCommentPostId();
    if (!postId) return;

    const loadingSignal = reset ? this.commentsLoading : this.commentsLoadingMore;
    if (reset) {
      this.comments.set([]);
      this.commentsHasMore.set(false);
      this.commentsPage.set(1);
    }
    loadingSignal.set(true);

    this.feedService.getComments(postId, page, 20)
      .pipe(finalize(() => loadingSignal.set(false)))
      .subscribe({
        next: (response) => {
          const data = response?.data || response;
          const fetched = data?.comments || [];
          if (reset) {
            this.comments.set(fetched);
          } else {
            this.comments.update((comments) => [...comments, ...fetched]);
          }
          this.commentsHasMore.set(page < (data?.pages || 1));
          this.commentsPage.set(page);
        },
        error: () => {
          this.snackBar.open('Failed to load comments', 'Dismiss', { duration: 3000 });
        }
      });
  }

  loadMoreComments(): void {
    if (!this.commentsHasMore() || this.commentsLoadingMore()) return;
    this.loadComments(this.commentsPage() + 1, false);
  }

  submitComment(): void {
    const content = this.commentDraft().trim();
    const userId = this.user()?._id;
    const postId = this.activeCommentPostId();
    if (!content || !userId || !postId || this.commentsSubmitting()) return;

    this.commentsSubmitting.set(true);
    this.feedService.addComment(postId, content, userId)
      .pipe(finalize(() => this.commentsSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          const comment = response?.data || response;
          this.comments.update((comments) => [comment, ...comments]);
          this.commentDraft.set('');
          this.feedService.incrementCommentCount(postId, 1);
          this.snackBar.open('Comment added', 'OK', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Failed to add comment', 'Dismiss', { duration: 3000 });
        }
      });
  }

  submitReply(parentComment: FeedComment): void {
    const content = this.replyDraft().trim();
    const userId = this.user()?._id;
    const postId = this.activeCommentPostId();
    if (!content || !userId || !postId || this.commentsSubmitting()) return;

    this.commentsSubmitting.set(true);
    this.feedService.addComment(postId, content, userId, parentComment._id)
      .pipe(finalize(() => this.commentsSubmitting.set(false)))
      .subscribe({
        next: (response) => {
          const reply = response?.data || response;
          this.comments.update((comments) =>
            comments.map((comment) =>
              comment._id === parentComment._id
                ? { ...comment, replies: [reply, ...(comment.replies || [])] }
                : comment
            )
          );
          this.replyDraft.set('');
          this.replyingTo.set(null);
          this.feedService.incrementCommentCount(postId, 1);
          this.snackBar.open('Reply added', 'OK', { duration: 2000 });
        },
        error: () => {
          this.snackBar.open('Failed to add reply', 'Dismiss', { duration: 3000 });
        }
      });
  }

  toggleCommentLike(comment: FeedComment, isReply: boolean = false, parent?: FeedComment): void {
    const userId = this.user()?._id;
    const postId = this.activeCommentPostId();
    if (!userId || !postId) return;

    const wasLiked = Boolean(comment.isLiked);
    this.updateCommentLike(comment, !wasLiked, isReply, parent);

    this.feedService.likeComment(postId, comment._id, userId).subscribe({
      error: () => {
        this.updateCommentLike(comment, wasLiked, isReply, parent);
        this.snackBar.open('Failed to update like', 'Dismiss', { duration: 2000 });
      }
    });
  }

  private updateCommentLike(comment: FeedComment, liked: boolean, isReply: boolean = false, parent?: FeedComment): void {
    const nextCount = (count: number) => Math.max(0, Number(count || 0) + (liked ? 1 : -1));

    if (isReply && parent) {
      this.comments.update((comments) =>
        comments.map((entry) =>
          entry._id === parent._id
            ? {
              ...entry,
              replies: (entry.replies || []).map((reply) =>
                reply._id === comment._id
                  ? { ...reply, isLiked: liked, likeCount: nextCount(reply.likeCount) }
                  : reply
              )
            }
            : entry
        )
      );
      return;
    }

    this.comments.update((comments) =>
      comments.map((entry) =>
        entry._id === comment._id
          ? { ...entry, isLiked: liked, likeCount: nextCount(entry.likeCount) }
          : entry
      )
    );
  }

  setReplyTo(comment: FeedComment): void {
    this.replyingTo.set(comment);
    this.replyDraft.set('');
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyDraft.set('');
  }

  trackByCommentId(_: number, comment: FeedComment): string {
    return comment._id;
  }

  formatCommentTime(date: string): string {
    return this.feedService.formatTime(date);
  }

  onCreatePost(): void {
    this.router.navigate(['/dashboard/community/feeds/create']);
  }

  onHashtagClick(hashtag: string): void {
    this.searchQuery.set(hashtag);
    this.selectedTab.set('trending');
  }

  onBoost(post: FeedPost): void {
    if (!post._id) return;
    this.feedService.boostPost(post._id).subscribe({
      next: () => this.snackBar.open('Post boosted for 24h! (₦500 charged)', 'OK', { duration: 3000 }),
      error: (e) => this.snackBar.open(e?.error?.message || 'Boost failed', 'OK', { duration: 3000 })
    });
  }

  onPromote(post: FeedPost): void {
    this.router.navigate(['/dashboard/campaigns/builder'], {
      queryParams: { sourcePostContent: post.content }
    });
  }

  onOpenChallenge(tag: string): void {
    this.searchQuery.set(tag);
    this.selectedTab.set('trending');
    this.loadFeed(true);
  }

  onRefresh(): void {
    this.loadFeed(true);
    this.feedService.loadLiveActivityFeed(6).subscribe();
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

  private startLiveActivityPolling(): void {
    if (this.liveActivitySubscription) {
      return;
    }

    this.liveActivitySubscription = timer(0, 60000)
      .pipe(switchMap(() => this.feedService.loadLiveActivityFeed(6)))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe?.();
    this.liveActivitySubscription?.unsubscribe?.();
    this.intersectionObserver?.disconnect?.();
  }
}
