import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AdminCollaborationReview,
  CollaborationReviewAction,
  CollaborationReviewModerationFilters,
  UserReviewModerationService,
} from './user-review-moderation.service';

@Component({
  selector: 'app-user-review-moderation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  providers: [DatePipe, TitleCasePipe],
  templateUrl: './user-review-moderation.component.html',
  styleUrls: ['./user-review-moderation.component.scss'],
})
export class UserReviewModerationComponent {
  private readonly moderationService = inject(UserReviewModerationService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  private readonly titleCasePipe = inject(TitleCasePipe);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly reviews = signal<AdminCollaborationReview[]>([]);
  readonly selectedReview = signal<AdminCollaborationReview | null>(null);
  readonly summary = signal({
    totalReviews: 0,
    published: 0,
    flagged: 0,
    hidden: 0,
    removed: 0,
  });
  readonly pagination = signal({
    page: 1,
    limit: 18,
    total: 0,
    totalPages: 1,
  });
  readonly moderationNote = signal('');
  readonly adminResponse = signal('');

  readonly filtersForm = this.fb.nonNullable.group({
    search: [''],
    status: ['all'],
    flaggedOnly: [false],
  });

  readonly statCards = computed(() => ([
    { label: 'Published', value: this.summary().published, icon: 'star', tone: 'published' },
    { label: 'Flagged', value: this.summary().flagged, icon: 'flag', tone: 'flagged' },
    { label: 'Hidden', value: this.summary().hidden, icon: 'visibility_off', tone: 'hidden' },
    { label: 'Removed', value: this.summary().removed, icon: 'delete_forever', tone: 'removed' },
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
      status: 'all',
      flaggedOnly: false,
    });
  }

  selectReview(review: AdminCollaborationReview): void {
    this.selectedReview.set(review);
    this.moderationNote.set(review.moderationNotes || '');
    this.adminResponse.set(review.adminResponse || '');
  }

  changePage(direction: 'prev' | 'next'): void {
    const current = this.pagination();
    const nextPage = direction === 'next' ? current.page + 1 : current.page - 1;
    if (nextPage < 1 || nextPage > current.totalPages) {
      return;
    }

    this.pagination.update((state) => ({ ...state, page: nextPage }));
    this.loadReviews();
  }

  quickModerate(review: AdminCollaborationReview, action: CollaborationReviewAction): void {
    this.selectReview(review);
    this.submitModeration(action);
  }

  submitModeration(action: CollaborationReviewAction): void {
    const review = this.selectedReview();
    if (!review) {
      return;
    }

    this.submitting.set(true);
    this.moderationService.moderateReview(review._id, {
      action,
      note: this.moderationNote().trim(),
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
            this.adminResponse.set(response.data.adminResponse || '');
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

  formatRelationshipType(value: string): string {
    return this.titleCasePipe.transform(String(value || '').replace(/_/g, ' ')) || 'Collaboration';
  }

  trackByReviewId(_index: number, review: AdminCollaborationReview): string {
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

    this.filtersForm.controls.flaggedOnly.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.resetToFirstPageAndReload());
  }

  private resetToFirstPageAndReload(): void {
    this.pagination.update((state) => ({ ...state, page: 1 }));
    this.loadReviews();
  }

  private buildFilters(): CollaborationReviewModerationFilters {
    const formValue = this.filtersForm.getRawValue();
    return {
      page: this.pagination().page,
      limit: this.pagination().limit,
      status: formValue.status as CollaborationReviewModerationFilters['status'],
      search: formValue.search.trim(),
      flaggedOnly: formValue.flaggedOnly,
    };
  }

  private loadReviews(): void {
    this.loading.set(true);
    this.moderationService.getReviews(this.buildFilters())
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
          this.adminResponse.set(refreshedSelection?.adminResponse || '');
        },
        error: (error) => {
          this.reviews.set([]);
          this.selectedReview.set(null);
          this.showError(error?.error?.message || 'Failed to load collaboration reviews.');
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
