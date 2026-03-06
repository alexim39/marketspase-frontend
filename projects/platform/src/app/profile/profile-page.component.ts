import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, DestroyRef } from '@angular/core';
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

import { FollowListDialogComponent } from './follow-list-dialog/follow-list-dialog.component';
import { ProfileService, ProfileUser } from './services/profile.service';
import { FeedPostCardComponent } from '../community/feeds/feed-post-card/feed-post-card.component';
import { FeedPost, FeedService } from '../community/feeds/feed.service';
import { UserService } from '../common/services/user.service';

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
  posts = signal<FeedPost[]>([]);
  postsPage = signal(1);
  postsHasMore = signal(true);
  postsLoading = signal(false);

  // Tabs
  activeTab = signal<'posts' | 'followers' | 'following'>('posts');

  // Infinite scroll anchor
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;
  private intersectionObserver: IntersectionObserver | null = null;

  ngOnInit(): void {
    // Listen to route params and load the appropriate profile
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const userId = params.get('id');
          
          // Case 1: We have an :id parameter – view that user's profile
          if (userId) {
            // Validate MongoDB ObjectId format
            if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
              // Invalid ID – redirect to current user's profile or home
              const currentUserId = this.currentUser()?._id;
              if (currentUserId) {
                this.router.navigate(['/profile', currentUserId]);
              } else {
                this.router.navigate(['/']);
              }
              return []; // stop the stream
            }
            return this.profileService.getProfile(userId);
          }
          
          // Case 2: No :id parameter – load the current user's profile
          const currentUserId = this.currentUser()?._id;
          if (!currentUserId) {
            // Not logged in – redirect to home
            this.router.navigate(['/']);
            return [];
          }
          return this.profileService.getProfile(currentUserId);
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
    this.intersectionObserver?.disconnect();
  }

  // Load posts with pagination
  loadPosts(reset = false): void {
    const profile = this.profile();
    if (!profile || this.postsLoading() || (!reset && !this.postsHasMore())) return;

    this.postsLoading.set(true);
    const page = reset ? 1 : this.postsPage();
    this.profileService.getUserPosts(profile._id, page).subscribe({
      next: (res) => {
        if (reset) {
          this.posts.set(res.posts ?? []);
          this.postsPage.set(2);
        } else {
          this.posts.update(prev => [...prev, ...(res.posts ?? [])]);
          this.postsPage.update(p => p + 1);
        }
        this.postsHasMore.set(res.page < res.totalPages);
        this.postsLoading.set(false);
        this.setupInfiniteScroll();
      },
      error: () => {
        this.postsLoading.set(false);
        this.snackBar.open('Failed to load posts', 'Dismiss', { duration: 3000 });
      }
    });
  }

  private setupInfiniteScroll(): void {
    if (!this.scrollAnchor) return;
    if (this.intersectionObserver) this.intersectionObserver.disconnect();

    this.intersectionObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && this.postsHasMore() && !this.postsLoading()) {
        this.loadPosts();
      }
    }, { threshold: 0.5 });

    this.intersectionObserver.observe(this.scrollAnchor.nativeElement);
  }

  // Toggle follow
  toggleFollow(): void {
    const profile = this.profile();
    if (!profile || profile.isOwnProfile) return;

    this.profileService.toggleFollow(profile._id).subscribe({
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

  // Open followers dialog
  showFollowers(): void {
    const profile = this.profile();
    if (!profile) return;
    this.dialog.open(FollowListDialogComponent, {
      width: '400px',
      data: { userId: profile._id, type: 'followers' },
    });
  }

  // Open following dialog
  showFollowing(): void {
    const profile = this.profile();
    if (!profile) return;
    this.dialog.open(FollowListDialogComponent, {
      width: '400px',
      data: { userId: profile._id, type: 'following' },
    });
  }

  // Edit profile (navigate to settings)
  editProfile(): void {
    this.router.navigate(['/dashboard/settings/profile']);
  }

  // Handle post actions
  onLike(post: FeedPost): void {
    this.feedService.toggleLike(post, this.currentUser()?._id ?? '').subscribe();
  }

  onSave(postId: string): void {
    this.feedService.toggleSave(postId, this.currentUser()?._id ?? '').subscribe();
  }

  onShare(post: FeedPost): void {
    if (navigator.share) {
      navigator.share({
        title: `${post.author?.displayName || 'User'} on MarketSpase`,
        text: post.content,
        url: `${window.location.origin}/feed/${post._id}`
      }).catch(() => this.copyPostLink(post._id));
    } else {
      this.copyPostLink(post._id);
    }
  }

  private copyPostLink(postId: string): void {
    const url = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
    });
  }

  onComment(postId: string): void {
    // Open comment dialog (implement as needed)
  }

  onHashtagClick(hashtag: string): void {
    this.router.navigate(['/dashboard/community/feeds'], { queryParams: { tag: hashtag } });
  }
}