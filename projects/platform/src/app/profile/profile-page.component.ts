import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, DestroyRef, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, filter, tap } from 'rxjs';

import { ProfileService, ProfileUser, FollowUser } from './services/profile.service';
import { FeedPostCardComponent } from '../community/feeds/feed-post-card/feed-post-card.component';
import { FeedPost, FeedService } from '../community/feeds/feed.service';
import { UserService } from '../common/services/user.service';
import { CommentDialogComponent } from '../community/feeds/comment-dialog/comment-dialog.component';

// Extend FeedPost to include interaction flags (returned by backend)
interface FeedPostWithFlags extends FeedPost {
  isLikedByMe?: boolean;
  isSavedByMe?: boolean;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    FeedPostCardComponent,
  ],
  providers: [ProfileService, FeedService],
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(ProfileService);
  private feedService = inject(FeedService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  // Current logged-in user
  currentUser = this.userService.user; // signal

  // Profile data
  profile = signal<ProfileUser | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  // Posts
  posts = signal<FeedPostWithFlags[]>([]);
  postsPage = signal(1);
  postsHasMore = signal(true);
  postsLoading = signal(false);

  // Liked and saved states (local sets for optimistic UI updates)
  likedPosts = signal<Set<string>>(new Set());
  savedPosts = signal<Set<string>>(new Set());

  // Followers/Following lists
  followers = signal<FollowUser[]>([]);
  following = signal<FollowUser[]>([]);
  followersPage = signal(1);
  followingPage = signal(1);
  followersHasMore = signal(true);
  followingHasMore = signal(true);
  loadingFollowers = signal(false);
  loadingFollowing = signal(false);
  followersLoadingMore = signal(false);
  followingLoadingMore = signal(false);

  // Tabs
  activeTabIndex = signal<number>(0);

  activeTab = computed(() => {
    const index = this.activeTabIndex();
    return index === 0 ? 'posts' : index === 1 ? 'followers' : 'following';
  });

  followersFetched = signal(false);
  followingFetched = signal(false);

  // Infinite scroll anchors
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  @ViewChild('followersScrollAnchor') followersScrollAnchor!: ElementRef;
  @ViewChild('followingScrollAnchor') followingScrollAnchor!: ElementRef;

  private postsObserver: IntersectionObserver | null = null;
  private followersObserver: IntersectionObserver | null = null;
  private followingObserver: IntersectionObserver | null = null;

  constructor() {
    // Effect to load followers/following when tab changes
    effect(() => {
      const tab = this.activeTab();
      const profile = this.profile();
      if (!profile) return;

      if (tab === 'followers' && !this.followersFetched() && !this.loadingFollowers()) {
        this.loadFollowers(true);
      } else if (tab === 'following' && !this.followingFetched() && !this.loadingFollowing()) {
        this.loadFollowing(true);
      }
    });
  }

  ngOnInit(): void {
    // Listen to route params and load the appropriate profile
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const userId = params.get('id');
          const currentUserId = this.currentUser()?._id;
          
          // Case 1: We have an :id parameter – view that user's profile
          if (userId) {
            // Validate MongoDB ObjectId format
            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
              // Invalid ID – redirect to current user's profile or home
              if (currentUserId) {
                this.router.navigate(['/profile', currentUserId]);
              } else {
                this.router.navigate(['/']);
              }
              return []; // stop the stream
            }
            return this.profileService.getProfile(userId, currentUserId ?? '');
          }
          
          // Case 2: No :id parameter – load the current user's profile
          if (!currentUserId) {
            // Not logged in – redirect to home
            this.router.navigate(['/']);
            return [];
          }
          return this.profileService.getProfile(currentUserId, currentUserId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (profile) => {
          if (profile) {
            this.profile.set(profile);
            this.loading.set(false);
            this.loadPosts(true); // load first page of posts
          }
        },
        error: (err) => {
          this.error.set('Failed to load profile');
          this.loading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.postsObserver?.disconnect();
    this.followersObserver?.disconnect();
    this.followingObserver?.disconnect();
  }

  // ---------- Posts ----------
  loadPosts(reset = false): void {
    const profile = this.profile();
    if (!profile || this.postsLoading() || (!reset && !this.postsHasMore())) return;

    this.postsLoading.set(true);
    const page = reset ? 1 : this.postsPage();
    this.profileService.getUserPosts(profile._id, page).subscribe({
      next: (res) => {
        const newPosts = (res.posts || []) as FeedPostWithFlags[];
        
        if (reset) {
          this.posts.set(newPosts);
          this.postsPage.set(2);
          this.updateLikedSavedSets(newPosts, reset);
        } else {
          this.posts.update(prev => [...prev, ...newPosts]);
          this.postsPage.update(p => p + 1);
          this.updateLikedSavedSets(newPosts, false);
        }
        this.postsHasMore.set(res.page < res.totalPages);
        this.postsLoading.set(false);
        this.setupPostsInfiniteScroll();
      },
      error: () => {
        this.postsLoading.set(false);
        this.snackBar.open('Failed to load posts', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private updateLikedSavedSets(posts: FeedPostWithFlags[], replace: boolean = true): void {
    if (replace) {
      this.likedPosts.set(new Set());
      this.savedPosts.set(new Set());
    }
    const likedSet = replace ? new Set<string>() : new Set(this.likedPosts());
    const savedSet = replace ? new Set<string>() : new Set(this.savedPosts());

    for (const post of posts) {
      if (post.isLikedByMe) {
        likedSet.add(post._id);
      }
      if (post.isSavedByMe) {
        savedSet.add(post._id);
      }
    }
    this.likedPosts.set(likedSet);
    this.savedPosts.set(savedSet);
  }

  private setupPostsInfiniteScroll(): void {
    if (!this.scrollAnchor) return;
    if (this.postsObserver) this.postsObserver.disconnect();

    this.postsObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.postsHasMore() && !this.postsLoading()) {
        this.loadPosts();
      }
    }, { threshold: 0.5 });

    this.postsObserver.observe(this.scrollAnchor.nativeElement);
  }

  // ---------- Followers ----------
  loadFollowers(reset = false): void {
    const profile = this.profile();
    if (!profile || this.loadingFollowers() || (!reset && !this.followersHasMore())) return;

    const loadMore = !reset && this.followers().length > 0;
    if (loadMore) {
      this.followersLoadingMore.set(true);
    } else {
      this.loadingFollowers.set(true);
      this.followers.set([]);
      this.followersPage.set(1);
      this.followersHasMore.set(true);
    }

    const page = reset ? 1 : this.followersPage();
    this.profileService.getFollowers(profile._id, page, 20).subscribe({
      next: (res) => {
        // Check if res is an array (unwrapped) or an object with followers property
        let newFollowers: FollowUser[] = [];
        if (Array.isArray(res)) {
          newFollowers = res;
          // If unwrapped, we don't have pagination info – assume all loaded
          this.followersHasMore.set(false);
        } else {
          newFollowers = (res as any).followers || [];
          this.followersHasMore.set((res as any).page < (res as any).totalPages);
        }
        
        if (reset || page === 1) {
          this.followers.set(newFollowers);
        } else {
          this.followers.update(prev => [...prev, ...newFollowers]);
        }
        
        this.followersPage.update(p => p + 1);
        this.loadingFollowers.set(false);
        this.followersLoadingMore.set(false);
        this.setupFollowersInfiniteScroll();
        this.followersFetched.set(true);
      },
      error: () => {
        this.loadingFollowers.set(false);
        this.followersLoadingMore.set(false);
        this.snackBar.open('Failed to load followers', 'Dismiss', { duration: 3000 });
      }
    });
    
  }

  private setupFollowersInfiniteScroll(): void {
    if (!this.followersScrollAnchor) return;
    if (this.followersObserver) this.followersObserver.disconnect();

    this.followersObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.followersHasMore() && !this.followersLoadingMore()) {
        this.loadFollowers();
      }
    }, { threshold: 0.5 });

    this.followersObserver.observe(this.followersScrollAnchor.nativeElement);
  }

  // ---------- Following ----------
  loadFollowing(reset = false): void {
    const profile = this.profile();
    if (!profile || this.loadingFollowing() || (!reset && !this.followingHasMore())) return;

    const loadMore = !reset && this.following().length > 0;
    if (loadMore) {
      this.followingLoadingMore.set(true);
    } else {
      this.loadingFollowing.set(true);
      this.following.set([]);
      this.followingPage.set(1);
      this.followingHasMore.set(true);
    }

    const page = reset ? 1 : this.followingPage();
    this.profileService.getFollowing(profile._id, page, 20).subscribe({
      next: (res) => {
        let newFollowing: FollowUser[] = [];
        if (Array.isArray(res)) {
          newFollowing = res;
          this.followingHasMore.set(false);
        } else {
          newFollowing = (res as any).following || [];
          this.followingHasMore.set((res as any).page < (res as any).totalPages);
        }
        if (reset || page === 1) {
          this.following.set(newFollowing);
        } else {
          this.following.update(prev => [...prev, ...newFollowing]);
        }
        this.followingPage.update(p => p + 1);
        this.loadingFollowing.set(false);
        this.followingLoadingMore.set(false);
        this.followingFetched.set(true);
        this.setupFollowingInfiniteScroll();
      },
      error: () => {
        this.loadingFollowing.set(false);
        this.followingLoadingMore.set(false);
        this.snackBar.open('Failed to load following', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private setupFollowingInfiniteScroll(): void {
    if (!this.followingScrollAnchor) return;
    if (this.followingObserver) this.followingObserver.disconnect();

    this.followingObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.followingHasMore() && !this.followingLoadingMore()) {
        this.loadFollowing();
      }
    }, { threshold: 0.5 });

    this.followingObserver.observe(this.followingScrollAnchor.nativeElement);
  }

  // ---------- Actions ----------
  toggleFollow(): void {
    const profile = this.profile();
    if (!profile || profile.isOwnProfile) return;

    const currentUserId = this.currentUser()?._id;
    this.profileService.toggleFollow(profile._id, currentUserId ?? '').subscribe({
      next: (res) => {
        this.profile.update(p => {
          if (!p) return p;
          return {
            ...p,
            isFollowing: res.followed,
            followersCount: res.followed ? p.followersCount + 1 : p.followersCount - 1,
          };
        });
        this.snackBar.open(res.followed ? 'Followed' : 'Unfollowed', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Action failed', 'Dismiss', { duration: 3000 });
      }
    });
  }

  // Edit profile (navigate to settings)
  editProfile(): void {
    this.router.navigate(['/dashboard/settings/account']);
  }

  // View another profile
  viewProfile(userId: string): void {
    this.router.navigate(['/dashboard/profile', userId]);
  }

  // ---------- Post interactions ----------
  onLike(post: FeedPostWithFlags): void {
    const userId = this.currentUser()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in', 'OK', { duration: 2000 });
      return;
    }

    const isLiked = this.likedPosts().has(post._id);
    if (isLiked) {
      this.likedPosts.update(set => {
        const newSet = new Set(set);
        newSet.delete(post._id);
        return newSet;
      });
      post.likeCount = (post.likeCount || 0) - 1;
      post.isLikedByMe = false;
    } else {
      this.likedPosts.update(set => {
        const newSet = new Set(set);
        newSet.add(post._id);
        return newSet;
      });
      post.likeCount = (post.likeCount || 0) + 1;
      post.isLikedByMe = true;
    }

    this.feedService.toggleLike(post, userId).subscribe({
      error: () => {
        // Revert on error
        if (isLiked) {
          this.likedPosts.update(set => {
            const newSet = new Set(set);
            newSet.add(post._id);
            return newSet;
          });
          post.likeCount = (post.likeCount || 0) + 1;
          post.isLikedByMe = true;
        } else {
          this.likedPosts.update(set => {
            const newSet = new Set(set);
            newSet.delete(post._id);
            return newSet;
          });
          post.likeCount = (post.likeCount || 0) - 1;
          post.isLikedByMe = false;
        }
        this.snackBar.open('Failed to update like', 'OK', { duration: 2000 });
      }
    });
  }

  onSave(postId: string): void {
    const userId = this.currentUser()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in', 'OK', { duration: 2000 });
      return;
    }

    const post = this.posts().find(p => p._id === postId);
    const isSaved = this.savedPosts().has(postId);

    if (isSaved) {
      this.savedPosts.update(set => {
        const newSet = new Set(set);
        newSet.delete(postId);
        return newSet;
      });
      if (post) post.isSavedByMe = false;
    } else {
      this.savedPosts.update(set => {
        const newSet = new Set(set);
        newSet.add(postId);
        return newSet;
      });
      if (post) post.isSavedByMe = true;
    }

    this.feedService.toggleSave(postId, userId).subscribe({
      error: () => {
        // Revert on error
        if (isSaved) {
          this.savedPosts.update(set => {
            const newSet = new Set(set);
            newSet.add(postId);
            return newSet;
          });
          if (post) post.isSavedByMe = true;
        } else {
          this.savedPosts.update(set => {
            const newSet = new Set(set);
            newSet.delete(postId);
            return newSet;
          });
          if (post) post.isSavedByMe = false;
        }
        this.snackBar.open('Failed to update save', 'OK', { duration: 2000 });
      }
    });
  }

  onComment(postId: string): void {
    this.dialog.open(CommentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'comment-dialog-panel',
      disableClose: true,
      data: { postId }
    });
  }

  onShare(post: FeedPostWithFlags): void {
    const userId = this.currentUser()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in', 'OK', { duration: 2000 });
      return;
    }

    if (navigator.share) {
      navigator.share({
        title: `${post.author?.displayName || 'User'} on MarketSpase`,
        text: post.content,
        url: `${window.location.origin}/feed/${post._id}`
      }).catch(() => this.copyPostLink(post._id));
    } else {
      this.copyPostLink(post._id);
    }

    this.feedService.sharePost(post._id, userId).subscribe({
      error: () => {
        this.snackBar.open('Failed to record share', 'OK', { duration: 2000 });
      }
    });
  }

  private copyPostLink(postId: string): void {
    const url = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
    });
  }

  onHashtagClick(hashtag: string): void {
    this.router.navigate(['/dashboard/community/feeds'], { queryParams: { tag: hashtag } });
  }
}