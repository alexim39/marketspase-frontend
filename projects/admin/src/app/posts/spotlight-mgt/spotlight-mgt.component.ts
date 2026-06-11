import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { PostService, AdminPostListItem } from '../post.service';

@Component({
  selector: 'app-spotlight-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatButtonModule
  ],
  templateUrl: './spotlight-mgt.component.html',
  styleUrls: ['./spotlight-mgt.component.scss']
})
export class SpotlightManagementComponent {
  private readonly postService = inject(PostService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loadingConfig = signal(true);
  readonly loadingPosts = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly postIds = signal<string[]>([]);
  readonly intervalMinutes = signal(120);
  readonly currentIndex = signal(0);
  readonly selectedIds = signal<Set<string>>(new Set());

  readonly searchQuery = signal('');
  readonly availablePosts = signal<AdminPostListItem[]>([]);
  readonly currentPage = signal(1);
  readonly totalPages = signal(0);

  private readonly searchSubject = new Subject<string>();
  private readonly searchDebounced = this.searchSubject.pipe(
    debounceTime(400),
    distinctUntilChanged()
  );

  readonly pageNumbers = computed(() => {
    const total = Math.max(1, this.totalPages());
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  readonly hasChanges = computed(() => {
    const idsArray = Array.from(this.selectedIds());
    const currentIds = this.postIds();
    if (idsArray.length !== currentIds.length) return true;
    return idsArray.some((id, i) => id !== currentIds[i]);
  });

  constructor() {
    this.searchDebounced
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPosts(true));

    this.loadConfig();
  }

  isSelected(postId: string): boolean {
    return this.selectedIds().has(postId);
  }

  private loadConfig(): void {
    this.loadingConfig.set(true);
    this.postService.getSpotlightConfig()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingConfig.set(false);
          this.loadPosts(true);
        })
      )
      .subscribe({
        next: (data) => {
          if (data.config) {
            this.postIds.set(data.config.postIds || []);
            this.intervalMinutes.set(data.config.intervalMinutes || 120);
            this.currentIndex.set(data.config.currentIndex || 0);
            this.selectedIds.set(new Set(data.config.postIds || []));
          }
        },
        error: () => {
          this.snackBar.open('Failed to load spotlight configuration', 'OK', { duration: 3000 });
        }
      });
  }

  loadPosts(reset: boolean = false): void {
    if (reset) this.currentPage.set(1);

    this.loadingPosts.set(true);
    this.error.set(null);

    const searchVal = this.searchQuery();
    const filters = {
      page: this.currentPage(),
      limit: 50,
      status: 'published',
      sort: '-createdAt',
      search: searchVal || undefined
    };

    this.postService.getPosts(filters)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingPosts.set(false))
      )
      .subscribe({
        next: (response) => {
          this.availablePosts.set(response.posts);
          this.totalPages.set(response.pagination.pages);
          this.error.set(null);
        },
        error: () => this.error.set('Failed to load posts')
      });
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.searchSubject.next('');
  }

  togglePostSelection(postId: string): void {
    this.selectedIds.update((set) => {
      const next = new Set(set);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  removeFromRotation(index: number): void {
    const idToRemove = this.postIds()[index];
    this.postIds.update((ids) => { const next = [...ids]; next.splice(index, 1); return next; });
    this.selectedIds.update((set) => { const next = new Set(set); next.delete(idToRemove); return next; });
  }

  saveSpotlight(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) {
      this.confirmClearSpotlight();
      return;
    }
    this.saving.set(true);
    this.postService.updateSpotlightConfig(ids, this.intervalMinutes())
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.postIds.set(ids);
          this.currentIndex.set(0);
          this.snackBar.open(`Spotlight rotation updated with ${ids.length} post(s)`, 'OK', { duration: 2500 });
        },
        error: (err) => this.snackBar.open(err?.error?.message || 'Failed to save', 'OK', { duration: 3000 })
      });
  }

  confirmClearSpotlight(): void {
    if (!confirm('Clear the spotlight rotation? All posts will be removed from the spotlight.')) return;
    this.saving.set(true);
    this.postService.clearSpotlight()
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.postIds.set([]);
          this.selectedIds.set(new Set());
          this.currentIndex.set(0);
          this.snackBar.open('Spotlight rotation cleared', 'OK', { duration: 2500 });
        },
        error: () => this.snackBar.open('Failed to clear spotlight', 'OK', { duration: 3000 })
      });
  }

  clearSpotlight(): void {
    this.confirmClearSpotlight();
  }

  goToPage(page: number): void {
    const total = Math.max(1, this.totalPages());
    const target = Math.max(1, Math.min(page, total));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
    this.loadPosts();
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
    input.value = '';
  }

  onIntervalChange(value: string): void {
    const num = Math.max(15, Math.min(43200, Number(value || 120)));
    this.intervalMinutes.set(num);
  }
}
