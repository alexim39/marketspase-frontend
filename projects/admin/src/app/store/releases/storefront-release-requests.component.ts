import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StoreReviewModerationService, StorefrontReleaseRequestOrder } from '../reviews/store-review-moderation.service';

@Component({
  selector: 'app-storefront-release-requests',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSnackBarModule,
  ],
  providers: [DatePipe],
  templateUrl: './storefront-release-requests.component.html',
  styleUrls: ['./storefront-release-requests.component.scss'],
})
export class StorefrontReleaseRequestsComponent {
  private readonly service = inject(StoreReviewModerationService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly orders = signal<StorefrontReleaseRequestOrder[]>([]);
  readonly selectedOrder = signal<StorefrontReleaseRequestOrder | null>(null);
  readonly note = signal('');
  readonly pagination = signal({
    limit: 20,
    skip: 0,
    total: 0,
    hasMore: false,
  });

  readonly filtersForm = this.fb.nonNullable.group({
    status: ['requested'],
  });

  readonly summary = computed(() => {
    const orders = this.orders();
    return {
      requested: orders.filter((order) => order.releaseRequest?.status === 'requested').length,
      approved: orders.filter((order) => order.releaseRequest?.status === 'approved').length,
      rejected: orders.filter((order) => order.releaseRequest?.status === 'rejected').length,
    };
  });

  constructor() {
    this.filtersForm.controls.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pagination.update((state) => ({ ...state, skip: 0 }));
        this.loadRequests();
      });

    this.loadRequests();
  }

  refresh(): void {
    this.loadRequests();
  }

  selectOrder(order: StorefrontReleaseRequestOrder): void {
    this.selectedOrder.set(order);
    this.note.set(order.releaseRequest?.reviewNote || '');
  }

  changePage(direction: 'prev' | 'next'): void {
    const state = this.pagination();
    const nextSkip = direction === 'next'
      ? state.skip + state.limit
      : Math.max(0, state.skip - state.limit);

    if (direction === 'next' && !state.hasMore) {
      return;
    }

    if (direction === 'prev' && state.skip === 0) {
      return;
    }

    this.pagination.update((current) => ({ ...current, skip: nextSkip }));
    this.loadRequests();
  }

  setNote(value: string): void {
    this.note.set(value);
  }

  review(decision: 'approved' | 'rejected'): void {
    const order = this.selectedOrder();
    if (!order?._id) {
      return;
    }

    this.submitting.set(true);
    this.service.reviewReleaseRequest(order._id, decision, this.note().trim())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.snackBar.open(response.message || 'Release request updated.', 'Close', { duration: 3000 });
          this.loadRequests();
        },
        error: (error) => {
          this.snackBar.open(error?.error?.message || 'Failed to update release request.', 'Close', { duration: 4000 });
        },
      });
  }

  formatDate(value?: string, format: string = 'medium'): string {
    return value ? this.datePipe.transform(value, format) || 'Not available' : 'Not available';
  }

  private loadRequests(): void {
    this.loading.set(true);
    const filters = this.filtersForm.getRawValue();
    const pagination = this.pagination();

    this.service.getReleaseRequests(filters.status as 'all' | 'requested' | 'approved' | 'rejected', pagination.limit, pagination.skip)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (response) => {
          const orders = response.data?.orders || [];
          this.orders.set(orders);
          this.pagination.update((state) => ({
            ...state,
            total: response.data?.pagination?.total || 0,
            hasMore: Boolean(response.data?.pagination?.hasMore),
          }));

          const selectedId = this.selectedOrder()?._id;
          const selected = orders.find((order) => order._id === selectedId) || orders[0] || null;
          this.selectedOrder.set(selected);
          this.note.set(selected?.releaseRequest?.reviewNote || '');
        },
        error: (error) => {
          this.orders.set([]);
          this.selectedOrder.set(null);
          this.snackBar.open(error?.error?.message || 'Failed to load delivery release requests.', 'Close', { duration: 4000 });
        },
      });
  }
}
