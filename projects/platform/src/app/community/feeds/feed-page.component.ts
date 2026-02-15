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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { 
  trigger, 
  transition, 
  style, 
  animate, 
  query, 
  stagger 
} from '@angular/animations';

import { FeedService, FeedPost } from './feed.service';
import { FeedPostCardComponent } from './feed-post-card/feed-post-card.component';
import { CommentDialogComponent } from './comment/comment-dialog.component';
import { UserService } from '../../common/services/user.service';

@Component({
  selector: 'app-feed-page',
  standalone: true,
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
    MatSlideToggleModule,
    //InfiniteScrollDirective,
    FeedPostCardComponent
  ],
  templateUrl: './feed-page.component.html',
  styleUrls: ['./feed-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('feedAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('400ms ease-out', 
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class FeedPageComponent implements OnInit, OnDestroy, AfterViewInit {
  private feedService = inject(FeedService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  private userService = inject(UserService);
  public user = this.userService.user;
  
  @ViewChild('feedContainer') feedContainer!: ElementRef;
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;

  // Signals
  posts = this.feedService.posts;
  likedPosts = this.feedService.likedPosts;
  savedPosts = this.feedService.savedPosts;
  loading = this.feedService.loading;
  error = this.feedService.error;
  hasMore = this.feedService.hasMore;
  trendingHashtags = this.feedService.trendingHashtags;
  
  // UI state signals
  selectedTab = signal<'all' | 'trending' | 'following' | 'saved'>('all');
  selectedType = signal<string>('all');
  searchQuery = signal<string>('');
  showFilters = signal<boolean>(false);
  
  // Computed signals
  filteredPosts = computed(() => {
    let posts = this.posts();
    const query = this.searchQuery().toLowerCase();
    
    if (query) {
      posts = posts.filter(post => 
        post.content.toLowerCase().includes(query) ||
        post.author.displayName.toLowerCase().includes(query) ||
        post.hashtags?.some(tag => tag.tag.includes(query))
      );
    }
    
    if (this.selectedType() !== 'all') {
      posts = posts.filter(post => post.type === this.selectedType());
    }
    
    if (this.selectedTab() === 'saved') {
      posts = posts.filter(post => this.savedPosts().has(post._id));
    }
    
    return posts;
  });

  featuredPost = this.feedService.featuredPost;
  regularPosts = computed(() => {
    return this.filteredPosts().filter(post => !post.isFeatured);
  });

  // Intersection Observer for infinite scroll
  private observer!: IntersectionObserver;

  constructor() {
    // Effect to show errors
    effect(() => {
      const error = this.error();
      if (error) {
        this.snackBar.open(error, 'Dismiss', { 
          duration: 5000,
          panelClass: 'error-snackbar'
        });
      }
    });
  }

  ngOnInit(): void {
    this.loadFeed();
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && this.hasMore() && !this.loading()) {
          this.loadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (this.scrollAnchor) {
      this.observer.observe(this.scrollAnchor.nativeElement);
    }
  }

  loadFeed(): void {
    this.feedService.loadFeedPosts(this.user()?._id ?? '', this.selectedType() !== 'all' ? this.selectedType() : undefined, undefined, true);
  }

  loadMore(): void {
    this.feedService.loadFeedPosts(
      this.user()?._id ?? '',
      this.selectedType() !== 'all' ? this.selectedType() : undefined
    );
  }

  onTabChange(tab: string): void {
    this.selectedTab.set(tab as any);
    if (tab === 'saved') {
      // Load saved posts
      this.feedService.loadFeedPosts(this.user()?._id ?? '', undefined, undefined, true);
    }
  }

  onTypeChange(type: string): void {
    this.selectedType.set(type);
    this.loadFeed();
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onLike(post: FeedPost): void {
    this.feedService.toggleLike(post).subscribe({
      next: () => {
        this.snackBar.open(
          post.isLiked ? 'Post liked!' : 'Post unliked',
          'OK',
          { duration: 2000 }
        );
      }
    });
  }

  onSave(postId: string): void {
    this.feedService.toggleSave(postId).subscribe({
      next: () => {
        this.snackBar.open(
          this.savedPosts().has(postId) ? 'Post saved!' : 'Post removed from saved',
          'OK',
          { duration: 2000 }
        );
      }
    });
  }

  onShare(post: FeedPost): void {
    if (navigator.share) {
      navigator.share({
        title: `${post.author.displayName} on MarketSpase`,
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
      data: { postId }
    });
  }

  onCreatePost(): void {
    this.router.navigate(['/dashboard/community/feeds/create']);

    // const dialogRef = this.dialog.open(CreatePostComponent, {
    //   width: '700px',
    //   maxWidth: '95vw',
    //   panelClass: 'create-post-dialog'
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     this.loadFeed(); // Refresh feed
    //   }
    // });
  }

  onHashtagClick(hashtag: string): void {
    this.searchQuery.set(`#${hashtag}`);
  }

  onRefresh(): void {
    this.loadFeed();
  }

  getPostIcon(type: string): string {
    // const icons = {
    //   earnings: 'emoji_events',
    //   campaign: 'campaign',
    //   question: 'help',
    //   tip: 'lightbulb',
    //   achievement: 'military_tech',
    //   milestone: 'flag'
    // };
    const icons: Record<string, string> = {
        earnings: 'emoji_events',
      campaign: 'campaign',
      question: 'help',
      tip: 'lightbulb',
      achievement: 'military_tech',
      milestone: 'flag'
    };
    return icons[type] || 'post_add';
  }

  getBadgeColor(badge: string): string {
    const colors: Record<string, string> = {
      'top-promoter': '#10b981',
      'verified': '#3b82f6',
      'rising-star': '#f59e0b',
      'expert': '#8b5cf6',
      'veteran': '#6b7280'
    };
    return colors[badge] || '#667eea';
  }
}