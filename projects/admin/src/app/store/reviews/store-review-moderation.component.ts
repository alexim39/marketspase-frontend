import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AdminStoreReview,
  ReviewModerationAction,
  ReviewModerationFilters,
  ReviewModerationSummary,
  StoreReviewModerationService,
} from './store-review-moderation.service';

@Component({
  selector: 'app-store-review-moderation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatProgressBarModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  providers: [DatePipe],
  templateUrl: './store-review-moderation.component.html',
  styleUrls: ['./store-review-moderation.component.scss'],
})
export class StoreReviewModerationComponent {
  private readonly reviewsService = inject(StoreReviewModerationService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly reviews = signal<AdminStoreReview[]>([]);
  readonly selectedReview = signal<AdminStoreReview | null>(null);
  readonly summary = signal<ReviewModerationSummary>({
    totalReviews: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    flagged: 0,
    reported: 0,
    featured: 0,
  });
  readonly pagination = signal({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
    hasMore: false,
  });
  readonly moderationNote = signal('');
  readonly adminResponse = signal('');

  readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    status: ['pending'],
    rating: ['all'],
    reportedOnly: [false],
    featured: ['all'],
  });

  readonly statCards = computed(() => ([
    { label: 'Pending', value: this.summary().pending, icon: 'schedule', tone: 'pending' },
    { label: 'Flagged', value: this.summary().flagged, icon: 'flag', tone: 'flagged' },
    { label: 'Approved', value: this.summary().approved, icon: 'check_circle', tone: 'approved' },
    { label: 'Reported', value: this.summary().reported, icon: 'report', tone: 'reported' },
  ]));

  constructor() {
    this.setupFilters();
    this.loadReviews();
  }

  refresh(): void {
    this.loadReviews();
  }

  clearFilters(): void {
    this.filtersForm.setValue({
      search: '',
      status: 'pending',
      rating: 'all',
      reportedOnly: false,
      featured: 'all',
    });
  }

  selectReview(review: AdminStoreReview): void {
    this.selectedReview.set(review);
    this.moderationNote.set(review.moderationNotes || '');
    this.adminResponse.set(review.response?.content || '');
  }

  changePage(direction: 'prev' | 'next'): void {
    const current = this.pagination();
    const nextPage = direction === 'next' ? current.page + 1 : current.page - 1;
    if (nextPage < 1 || nextPage > current.pages) {
      return;
    }

    this.pagination.update((state) => ({ ...state, page: nextPage }));
    this.loadReviews();
  }

  quickModerate(review: AdminStoreReview, action: ReviewModerationAction): void {
    this.selectReview(review);
    this.submitModeration(action);
  }

  submitModeration(action: ReviewModerationAction): void {
    const review = this.selectedReview();
    if (!review) {
      return;
    }

    if (action === 'respond' && !this.adminResponse().trim()) {
      this.showError('Please enter a response before sending it.');
      return;
    }

    this.submitting.set(true);
    this.reviewsService.moderateReview(review._id, {
      action,
      note: this.moderationNote().trim(),
      featured: !review.isFeatured,
      response: this.adminResponse().trim(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.showSuccess(response.message || 'Review updated successfully.');
          if (response.data) {
            this.selectedReview.set(response.data);
            this.moderationNote.set(response.data.moderationNotes || '');
            this.adminResponse.set(response.data.response?.content || '');
          } else {
            this.selectedReview.set(null);
            this.moderationNote.set('');
            this.adminResponse.set('');
          }
          this.loadReviews();
        },
        error: (error) => {
          this.showError(error?.error?.message || 'Failed to update this review.');
        },
      });
  }

  setModerationNote(value: string): void {
    this.moderationNote.set(value);
  }

  setAdminResponse(value: string): void {
    this.adminResponse.set(value);
  }

  formatDate(value?: string | null, format: string = 'medium'): string {
    if (!value) {
      return 'Not available';
    }
    return this.datePipe.transform(value, format) || 'Not available';
  }

  trackByReviewId(_index: number, review: AdminStoreReview): string {
    return review._id;
  }

  private setupFilters(): void {
    this.filtersForm.controls.search.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.resetToFirstPageAndReload());

    this.filtersForm.controls.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetToFirstPageAndReload());

    this.filtersForm.controls.rating.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetToFirstPageAndReload());

    this.filtersForm.controls.reportedOnly.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetToFirstPageAndReload());

    this.filtersForm.controls.featured.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetToFirstPageAndReload());
  }

  private resetToFirstPageAndReload(): void {
    this.pagination.update((state) => ({ ...state, page: 1 }));
    this.loadReviews();
  }

  private buildFilters(): ReviewModerationFilters {
    const formValue = this.filtersForm.getRawValue();
    return {
      page: this.pagination().page,
      limit: this.pagination().limit,
      status: formValue.status as ReviewModerationFilters['status'],
      search: formValue.search.trim(),
      rating: formValue.rating === 'all' ? null : Number(formValue.rating),
      reportedOnly: formValue.reportedOnly,
      featured: formValue.featured as ReviewModerationFilters['featured'],
    };
  }

  private loadReviews(): void {
    this.loading.set(true);
    this.reviewsService.getReviews(this.buildFilters())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.reviews.set(response.data || []);
          this.summary.set(response.summary);
          this.pagination.set(response.pagination);

          const selectedId = this.selectedReview()?._id;
          const refreshedSelection = response.data.find((item) => item._id === selectedId) || response.data[0] || null;
          this.selectedReview.set(refreshedSelection);
          this.moderationNote.set(refreshedSelection?.moderationNotes || '');
          this.adminResponse.set(refreshedSelection?.response?.content || '');
        },
        error: (error) => {
          this.reviews.set([]);
          this.selectedReview.set(null);
          this.showError(error?.error?.message || 'Failed to load product reviews.');
        },
      });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 4000 });
  }
}
