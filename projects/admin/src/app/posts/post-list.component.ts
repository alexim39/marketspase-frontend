import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { PostService, AdminPostListItem, AdminPostFilters } from './post.service';

@Component({
  selector: 'app-admin-post-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.scss']
})
export class AdminPostListComponent {
  private readonly postService = inject(PostService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly posts = signal<AdminPostListItem[]>([]);
  readonly loading = this.postService.loading;
  readonly loadingInitial = signal(true);
  readonly error = signal<string | null>(null);

  readonly pagination = signal({ page: 1, limit: 20, total: 0, pages: 0 });

  readonly searchQuery = signal('');
  readonly statusFilter = signal<string>('');
  readonly typeFilter = signal<string>('');
  readonly featuredFilter = signal<string>('');
  readonly sortOrder = signal<string>('-createdAt');
  readonly currentPage = signal(1);

  // Debounced search
  private readonly searchSubject = new Subject<string>();
  private readonly searchDebounced = this.searchSubject.pipe(
    debounceTime(400),
    distinctUntilChanged()
  );

  // Spotlight management
  readonly spotlightOpen = signal(false);
  readonly spotlightPostIds = signal<string[]>([]);
  readonly spotlightInterval = signal(120);
  readonly spotlightLoading = signal(false);
  readonly spotlightSaving = signal(false);

  readonly totalPages = computed(() => Math.max(1, this.pagination().pages));

  readonly showingRange = computed(() => {
    const p = this.pagination();
    if (p.total === 0) return 'No posts';
    const start = (p.page - 1) * p.limit + 1;
    const end = Math.min(p.page * p.limit, p.total);
    return `${start}–${end} of ${p.total}`;
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    // Show window of up to 5 pages around current, plus first/last
    const windowStart = Math.max(1, current - 2);
    const windowEnd = Math.min(total, current + 2);
    for (let i = windowStart; i <= windowEnd; i++) pages.push(i);
    return pages;
  });

  readonly showFirstPage = computed(() => this.currentPage() > 3);
  readonly showLastPage = computed(() => this.currentPage() < this.totalPages() - 2);
  readonly showStartEllipsis = computed(() => this.currentPage() > 4);
  readonly showEndEllipsis = computed(() => this.currentPage() < this.totalPages() - 3);

  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.statusFilter()) count++;
    if (this.typeFilter()) count++;
    if (this.featuredFilter()) count++;
    return count;
  });

  // Spotlight selected set derived from postIds
  readonly spotlightSelectedIds = computed(() => new Set(this.spotlightPostIds()));

  readonly postTypeOptions = [
    { value: '', label: 'All types' },
    { value: 'story', label: 'Story' },
    { value: 'campaign', label: 'Campaign' },
    { value: 'product', label: 'Product' },
    { value: 'challenge', label: 'Challenge' },
    { value: 'earnings', label: 'Earnings' },
    { value: 'tip', label: 'Tip' },
    { value: 'achievement', label: 'Achievement' }
  ];

  readonly statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
    { value: 'draft', label: 'Draft' }
  ];

  readonly featuredOptions = [
    { value: '', label: 'All' },
    { value: 'true', label: 'Featured only' },
    { value: 'false', label: 'Not featured' }
  ];

  readonly sortOptions = [
    { value: '-createdAt', label: 'Newest first' },
    { value: 'createdAt', label: 'Oldest first' },
    { value: '-likeCount', label: 'Most liked' },
    { value: '-commentCount', label: 'Most commented' }
  ];

  constructor() {
    // Set up debounced search
    this.searchDebounced
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.loadPosts(true);
      });

    this.loadPosts(true);
    this.loadSpotlightConfig();
  }

  loadPosts(reset: boolean = false): void {
    if (reset) {
      this.currentPage.set(1);
    }

    const filters: AdminPostFilters = {
      page: this.currentPage(),
      limit: 20,
      sort: this.sortOrder(),
      status: this.statusFilter() || undefined,
      type: this.typeFilter() || undefined,
      isFeatured: this.featuredFilter() || undefined,
      search: this.searchQuery() || undefined
    };

    this.postService.getPosts(filters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingInitial.set(false))
      )
      .subscribe({
        next: (response) => {
          this.posts.set(response.posts);
          this.pagination.set(response.pagination);
          this.error.set(null);
        },
        error: (err) => {
          console.error('Failed to load posts:', err);
          this.error.set('Failed to load feed posts. Please try again.');
          this.posts.set([]);
        }
      });
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  onStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.loadPosts(true);
  }

  onTypeFilter(type: string): void {
    this.typeFilter.set(type);
    this.loadPosts(true);
  }

  onFeaturedFilter(value: string): void {
    this.featuredFilter.set(value);
    this.loadPosts(true);
  }

  onSortChange(sort: string): void {
    this.sortOrder.set(sort);
    this.loadPosts(true);
  }

  clearFilters(): void {
    this.statusFilter.set('');
    this.typeFilter.set('');
    this.featuredFilter.set('');
    this.searchSubject.next('');
    this.loadPosts(true);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    const target = Math.max(1, Math.min(page, total));
    if (target === this.currentPage() || target < 1 || target > total) return;
    this.currentPage.set(target);
    this.loadPosts();
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
  }

  viewPost(postId: string): void {
    this.router.navigate(['/dashboard/posts', postId]);
  }

  onToggleFeature(post: AdminPostListItem, event: Event): void {
    event.stopPropagation();
    const newFeatured = !post.isFeatured;

    this.postService.toggleFeature(post._id, newFeatured, 7)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.posts.update((posts) =>
            posts.map((p) =>
              p._id === post._id
                ? { ...p, isFeatured: newFeatured, featuredUntil: newFeatured ? new Date().toISOString() : null }
                : p
            )
          );
        },
        error: (err) => {
          console.error('Failed to toggle feature:', err);
          this.snackBar.open('Failed to toggle feature', 'OK', { duration: 3000 });
        }
      });
  }

  onDeletePost(post: AdminPostListItem, event: Event): void {
    event.stopPropagation();
    const confirmed = window.confirm(
      `Archive this post by "${post.author?.displayName || 'Unknown'}"?\nThis can be undone by changing its status back to "published".`
    );
    if (!confirmed) return;

    this.postService.deletePost(post._id, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.posts.update((posts) => posts.filter((p) => p._id !== post._id));
          this.pagination.update((p) => ({
            ...p,
            total: Math.max(0, p.total - 1)
          }));
        },
        error: (err) => {
          console.error('Failed to delete post:', err);
          this.snackBar.open('Failed to archive post', 'OK', { duration: 3000 });
        }
      });
  }

  // ---- Spotlight Management ----

  loadSpotlightConfig(): void {
    this.spotlightLoading.set(true);
    this.postService.getSpotlightConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.spotlightLoading.set(false))
      )
      .subscribe({
        next: (data) => {
          if (data.config?.postIds?.length) {
            this.spotlightPostIds.set(data.config.postIds);
            this.spotlightInterval.set(data.config.intervalMinutes || 120);
          } else {
            this.spotlightPostIds.set([]);
            this.spotlightInterval.set(120);
          }
        },
        error: () => {
          this.spotlightPostIds.set([]);
          this.spotlightInterval.set(120);
        }
      });
  }

  toggleSpotlight(): void {
    this.spotlightOpen.update((v) => !v);
  }

  isInSpotlight(postId: string): boolean {
    return this.spotlightPostIds().includes(postId);
  }

  toggleSpotlightPost(postId: string): void {
    this.spotlightPostIds.update((ids) => {
      const idx = ids.indexOf(postId);
      if (idx >= 0) {
        return ids.filter((id) => id !== postId);
      }
      return [...ids, postId];
    });
  }

  moveSpotlightPost(fromIndex: number, direction: -1 | 1): void {
    this.spotlightPostIds.update((ids) => {
      const toIndex = fromIndex + direction;
      if (toIndex < 0 || toIndex >= ids.length) return ids;
      const next = [...ids];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  }

  saveSpotlight(): void {
    const ids = this.spotlightPostIds();
    if (ids.length === 0) {
      this.confirmClearSpotlight();
      return;
    }

    this.spotlightSaving.set(true);
    this.postService.updateSpotlightConfig(ids, this.spotlightInterval())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.spotlightSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.snackBar.open(`Spotlight rotation set with ${ids.length} post(s), every ${this.spotlightInterval()} min`, 'OK', { duration: 3000 });
          this.spotlightOpen.set(false);
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Failed to save spotlight', 'OK', { duration: 3000 });
        }
      });
  }

  confirmClearSpotlight(): void {
    if (!confirm('Clear the spotlight rotation? All posts will be removed from the spotlight.')) return;

    this.spotlightSaving.set(true);
    this.postService.clearSpotlight()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.spotlightSaving.set(false))
      )
      .subscribe({
        next: () => {
          this.spotlightPostIds.set([]);
          this.spotlightInterval.set(120);
          this.snackBar.open('Spotlight rotation cleared', 'OK', { duration: 2500 });
          this.spotlightOpen.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to clear spotlight', 'OK', { duration: 3000 });
        }
      });
  }

  onIntervalChange(value: string): void {
    const num = Math.max(1, Math.min(43200, Number(value || 120)));
    this.spotlightInterval.set(num);
  }

  // ---- Utilities ----

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      story: 'article',
      campaign: 'campaign',
      product: 'sell',
      challenge: 'emoji_events',
      earnings: 'trending_up',
      tip: 'lightbulb',
      achievement: 'stars',
      milestone: 'flag'
    };
    return icons[type] || 'post_add';
  }

  getMediaIcon(type: string | null): string {
    if (type === 'video') return 'videocam';
    if (type === 'image') return 'image';
    if (type === 'document') return 'description';
    return 'photo_library';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return this.formatDate(dateStr);
  }

  trackByPostId(_: number, post: AdminPostListItem): string {
    return post._id;
  }

  trackByIndex(_: number, item: any): number {
    return _;
  }
}
