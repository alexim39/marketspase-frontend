import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StoreService } from '../store.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';

type SubscriberStatus = 'all' | 'subscribed' | 'unsubscribed';

@Component({
  selector: 'admin-store-subscribers',
  standalone: true,
  providers: [StoreService, ...provideNativeDateAdapter()],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './store-subscribers.component.html',
  styleUrls: ['./store-subscribers.component.scss'],
})
export class StoreSubscribersComponent {
  private readonly storeService = inject(StoreService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly subscribers = signal<any[]>([]);
  readonly deletingIds = signal<Set<string>>(new Set());
  readonly pagination = signal({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  readonly storeOptions = signal<Array<{ _id: string; name: string; storeLink?: string; logo?: string }>>([]);

  readonly search = signal('');
  readonly storeFilter = signal('all');
  readonly statusFilter = signal<SubscriberStatus>('all');
  readonly sourceFilter = signal('all');

  // Date range (simple: use ISO strings)
  readonly startDate = signal<Date | null>(null);
  readonly endDate = signal<Date | null>(null);

  constructor() {
    this.loadSubscribers(true);
  }

  loadSubscribers(resetPage = false): void {
    if (resetPage) {
      this.pagination.update((current) => ({ ...current, page: 1 }));
    }

    this.loading.set(true);

    this.storeService
      .getAdminSubscribers({
        page: this.pagination().page,
        limit: this.pagination().limit,
        search: this.search().trim(),
        storeId: this.storeFilter() !== 'all' ? this.storeFilter() : undefined,
        status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
        source: this.sourceFilter() !== 'all' ? this.sourceFilter() : undefined,
        startDate: this.startDate() || undefined,
        endDate: this.endDate() || undefined,
        sortBy: 'subscribedAt',
        sortOrder: 'desc',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response?.data || {};
          this.subscribers.set(data.subscribers || []);
          this.pagination.set(data.pagination || this.pagination());
          this.storeOptions.set(data.filters?.stores || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load store subscribers:', error);
          this.loading.set(false);
          this.snackBar.open(error?.error?.message || 'Failed to load subscribers.', 'Close', { duration: 3200 });
        },
      });
  }

  nextPage(): void {
    if (this.pagination().page >= this.pagination().totalPages) return;
    this.pagination.update((current) => ({ ...current, page: current.page + 1 }));
    this.loadSubscribers(false);
  }

  prevPage(): void {
    if (this.pagination().page <= 1) return;
    this.pagination.update((current) => ({ ...current, page: current.page - 1 }));
    this.loadSubscribers(false);
  }

  resetFilters(): void {
    this.search.set('');
    this.storeFilter.set('all');
    this.statusFilter.set('all');
    this.sourceFilter.set('all');
    this.startDate.set(null);
    this.endDate.set(null);
    this.loadSubscribers(true);
  }

  statusLabel(value?: string | null): string {
    const normalized = String(value || 'subscribed').toLowerCase();
    return normalized === 'unsubscribed' ? 'Unsubscribed' : 'Subscribed';
  }

  statusTone(value?: string | null): 'good' | 'warn' {
    return String(value || 'subscribed').toLowerCase() === 'unsubscribed' ? 'warn' : 'good';
  }

  async copyEmail(email?: string | null): Promise<void> {
    if (!email) {
      this.snackBar.open('No email to copy.', 'Close', { duration: 2400 });
      return;
    }
    try {
      await navigator.clipboard.writeText(email);
      this.snackBar.open('Email copied.', 'Close', { duration: 2000 });
    } catch {
      this.snackBar.open('Copy failed on this device.', 'Close', { duration: 3000 });
    }
  }

  openEmail(email?: string | null): void {
    if (!email) return;
    window.location.href = `mailto:${encodeURIComponent(email)}`;
  }

  deleteSubscriber(row: any): void {
    const subscriberId = String(row?._id || '');
    const email = row?.email ? String(row.email) : 'this subscriber';
    const storeName = row?.store?.name ? String(row.store.name) : 'the store';

    if (!subscriberId) return;
    if (this.deletingIds().has(subscriberId)) return;

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete subscriber',
        message: `Are you sure you want to delete ${email} from ${storeName}? This will remove the record from subscriber lists.`,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: 'warn',
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.deletingIds.update((current) => {
          const next = new Set(current);
          next.add(subscriberId);
          return next;
        });

        this.storeService.deleteAdminSubscriber(subscriberId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (resp) => {
              this.deletingIds.update((current) => {
                const next = new Set(current);
                next.delete(subscriberId);
                return next;
              });

              if (resp?.success) {
                this.snackBar.open('Subscriber deleted.', 'Close', { duration: 2600 });
                this.loadSubscribers(false);
                return;
              }

              this.snackBar.open(resp?.message || 'Failed to delete subscriber.', 'Close', { duration: 3200 });
            },
            error: (error) => {
              console.error('Failed to delete subscriber:', error);
              this.deletingIds.update((current) => {
                const next = new Set(current);
                next.delete(subscriberId);
                return next;
              });
              this.snackBar.open(error?.error?.message || 'Failed to delete subscriber.', 'Close', { duration: 3200 });
            },
          });
      });
  }

  exportCsv(): void {
    const rows = this.subscribers().map((row) => {
      const store = row.store || {};
      const owner = row.storeOwner || {};
      return {
        email: row.email || '',
        status: row.status || '',
        source: row.source || '',
        subscribedAt: row.subscribedAt || '',
        firstSubscribedAt: row.firstSubscribedAt || '',
        deviceType: row.deviceType || '',
        storeName: store.name || '',
        storeLink: store.storeLink || '',
        ownerName: owner.displayName || '',
        ownerUsername: owner.username || '',
        ownerEmail: owner.email || '',
        referrer: row.referrer || '',
      };
    });

    const header = Object.keys(rows[0] || { email: '' });
    const csv = [header.join(','), ...rows.map((r) => header.map((k) => JSON.stringify((r as any)[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storefront-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
