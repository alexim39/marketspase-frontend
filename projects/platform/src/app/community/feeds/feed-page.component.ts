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
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
//import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { FeedService, FeedPost } from './feed.service';
import { FeedPostCardComponent } from './feed-post-card/feed-post-card.component';
import { CommentDialogComponent } from './comment-dialog/comment-dialog.component';
import { UserService } from '../../common/services/user.service';

@Component({
  selector: 'app-feed-page',
  standalone: true,
  providers: [FeedService],
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
    MatSelectModule,
    //InfiniteScrollModule,
    FeedPostCardComponent
  ],
  templateUrl: './feed-page.component.html',
  styleUrls: ['./feed-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedPageComponent {
  private feedService = inject(FeedService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private userService = inject(UserService);

  public user = this.userService.user;
  
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;

  // Feed service signals
  posts = this.feedService.posts;
  likedPosts = this.feedService.likedPosts;
  savedPosts = this.feedService.savedPosts;
  loading = this.feedService.loading;
  hasMore = this.feedService.hasMore;
  trendingHashtags = this.feedService.trendingHashtags;
  featuredPost = this.feedService.featuredPost;

  // UI state signals
  mobileMenuOpen = signal<boolean>(false);
  selectedTab = signal<'for-you' | 'following' | 'trending' | 'explore' | 'notifications' | 'profile'>('for-you');
  selectedType = signal<string>('all');
  searchQuery = signal<string>('');
  showFilters = signal<boolean>(false);
  unreadNotifications = signal<number>(3);
  unreadMessages = signal<number>(2);
  
  // Suggested users for "Who to follow"
  suggestedUsers = signal<any[]>([
    {
      _id: '1',
      displayName: 'John Doe',
      username: 'johndoe',
      avatar: 'img/avatar.png'
    },
    {
      _id: '2',
      displayName: 'Jane Smith',
      username: 'janesmith',
      avatar: 'img/avatar.png'
    },
    {
      _id: '3',
      displayName: 'Mike Johnson',
      username: 'mikej',
      avatar: 'img/avatar.png'
    }
  ]);

  // Following set
  following = signal<Set<string>>(new Set());

filteredPosts = computed(() => this.posts() ?? []);

regularPosts = computed(() => {
  // Return all posts without featured filtering
  return this.filteredPosts();
});

private readonly _ = effect(() => {
  const user = this.user();
  if (!user?._id) return;

  queueMicrotask(() => {
    this.loadFeed();
  });
});

constructor() {

  // Feed loader effect (reacts to user + tab safely)
  effect(() => {
    const currentUser = this.user();
    const tab = this.selectedTab();

    if (!currentUser?._id) return;

    console.log('[Feed Effect] Loading feed for tab:', tab);

    queueMicrotask(() => {
      if (tab === 'following') {
        this.loadFollowingFeed();
      } else {
        this.loadFeed();
      }
    });
  });


  // Error display effect
  effect(() => {
    const error = this.feedService.error();
    if (!error) return;

    this.snackBar.open(error, 'Dismiss', { 
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  });

}




  // Navigation methods
  toggleMobileMenu(): void {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  navigateTo(route: string): void {
    this.mobileMenuOpen.set(false);
    switch(route) {
      case 'feed':
        this.selectedTab.set('for-you');
        break;
      case 'explore':
        this.router.navigate(['/dashboard/explore']);
        break;
      case 'notifications':
        this.router.navigate(['/dashboard/notifications']);
        break;
      case 'messages':
        this.router.navigate(['/dashboard/messages']);
        break;
      case 'profile':
        this.router.navigate(['/dashboard/profile', this.user()?._id]);
        break;
      case 'bookmarks':
        this.router.navigate(['/dashboard/bookmarks']);
        break;
      case 'settings':
        this.router.navigate(['/dashboard/settings']);
        break;
    }
  }

  // Feed methods
  loadFeed(): void {
    this.feedService.loadFeedPosts(
      this.user()?._id ?? '', 
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      true
    );
  }

  loadFollowingFeed(): void {
    // Load feed from followed users
    this.feedService.loadFeedPosts(
      this.user()?._id ?? '',
      this.selectedType() !== 'all' ? this.selectedType() : undefined,
      undefined,
      true,
      //'following'
    );
  }

  loadMore(): void {
    if (!this.loading() && this.hasMore()) {
      this.feedService.loadFeedPosts(
        this.user()?._id ?? '',
        this.selectedType() !== 'all' ? this.selectedType() : undefined,
        undefined,
        false
      );
    }
  }

  onSearch(query: string = ''): void {
  // onSearch(query: string): void {
    this.searchQuery.set(query);
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
      }).catch(() => {
        this.copyToClipboard(post._id);
      });
    } else {
      this.copyToClipboard(post._id);
    }
  } 
  
  private copyToClipboard(postId: string): void {
    const url = `${window.location.origin}/feed/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
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

  onCreatePost(): void {
    this.router.navigate(['/dashboard/community/feeds/create']);
  }

  onHashtagClick(hashtag: string): void {
    this.searchQuery.set(hashtag);
    this.selectedTab.set('for-you');
  }

  onRefresh(): void {
    this.loadFeed();
  }

  // Follow methods
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

  showMoreTrending(): void {
    this.router.navigate(['/dashboard/trending']);
  }

  onNotifications(): void {
    this.router.navigate(['/dashboard/notifications']);
  }

  onMessages(): void {
    this.router.navigate(['/dashboard/messages']);
  }

  
}