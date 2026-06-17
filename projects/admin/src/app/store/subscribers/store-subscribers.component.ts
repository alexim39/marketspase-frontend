import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { StoreService } from '../store.service';
import { ConfirmationDialogComponent } from '../shared/confirmation-dialog/confirmation-dialog.component';

type SubscriberStatus = 'all' | 'subscribed' | 'unsubscribed';

@Component({
  selector: 'admin-store-subscribers',
  standalone: true,
  providers: [StoreService],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
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
  readonly pagination = signal({ page: 1, limit: 25, total: 0, totalPages: 1 });
  readonly storeOptions = signal<Array<{ _id: string; name: string; storeLink?: string; logo?: string }>>([]);

  readonly search = signal('');
  readonly storeFilter = signal('all');
  readonly statusFilter = signal<SubscriberStatus>('all');
  readonly sourceFilter = signal('all');
  readonly startDate = signal('');
  readonly endDate = signal('');

  constructor() { this.loadSubscribers(true); }

  loadSubscribers(resetPage = false): void {
    if (resetPage) this.pagination.update(c => ({ ...c, page: 1 }));
    this.loading.set(true);
    this.storeService.getAdminSubscribers({
      page: this.pagination().page, limit: this.pagination().limit,
      search: this.search().trim(), storeId: this.storeFilter() !== 'all' ? this.storeFilter() : undefined,
      status: this.statusFilter() !== 'all' ? this.statusFilter() : undefined,
      source: this.sourceFilter() !== 'all' ? this.sourceFilter() : undefined,
      startDate: this.startDate() ? new Date(this.startDate()) : undefined,
      endDate: this.endDate() ? new Date(this.endDate()) : undefined,
      sortBy: 'subscribedAt', sortOrder: 'desc',
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => { const d = r?.data || {}; this.subscribers.set(d.subscribers || []); this.pagination.set(d.pagination || this.pagination()); this.storeOptions.set(d.filters?.stores || []); this.loading.set(false); },
      error: (e) => { this.loading.set(false); this.snackBar.open(e?.error?.message || 'Failed to load subscribers.', 'Close', { duration: 3200 }); },
    });
  }

  nextPage(): void { if (this.pagination().page >= this.pagination().totalPages) return; this.pagination.update(c => ({ ...c, page: c.page + 1 })); this.loadSubscribers(false); }
  prevPage(): void { if (this.pagination().page <= 1) return; this.pagination.update(c => ({ ...c, page: c.page - 1 })); this.loadSubscribers(false); }

  resetFilters(): void { this.search.set(''); this.storeFilter.set('all'); this.statusFilter.set('all'); this.sourceFilter.set('all'); this.startDate.set(''); this.endDate.set(''); this.loadSubscribers(true); }

  statusLabel(v?: string | null): string { return String(v || 'subscribed').toLowerCase() === 'unsubscribed' ? 'Unsubscribed' : 'Subscribed'; }
  statusTone(v?: string | null): 'good' | 'warn' { return String(v || 'subscribed').toLowerCase() === 'unsubscribed' ? 'warn' : 'good'; }

  async copyEmail(email?: string | null): Promise<void> {
    if (!email) { this.snackBar.open('No email to copy.', 'Close', { duration: 2400 }); return; }
    try { await navigator.clipboard.writeText(email); this.snackBar.open('Email copied.', 'Close', { duration: 2000 }); }
    catch { this.snackBar.open('Copy failed on this device.', 'Close', { duration: 3000 }); }
  }

  openEmail(email?: string | null): void { if (!email) return; window.location.href = `mailto:${encodeURIComponent(email)}`; }

  deleteSubscriber(row: any): void {
    const subscriberId = String(row?._id || ''); const email = row?.email ? String(row.email) : 'this subscriber';
    const storeName = row?.store?.name ? String(row.store.name) : 'the store';
    if (!subscriberId || this.deletingIds().has(subscriberId)) return;
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { title: 'Delete subscriber', message: `Are you sure you want to delete ${email} from ${storeName}?`, confirmButtonText: 'Delete', cancelButtonText: 'Cancel', confirmButtonColor: 'warn' },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.deletingIds.update(c => { const n = new Set(c); n.add(subscriberId); return n; });
      this.storeService.deleteAdminSubscriber(subscriberId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (r) => { this.deletingIds.update(c => { const n = new Set(c); n.delete(subscriberId); return n; }); if (r?.success) { this.snackBar.open('Subscriber deleted.', 'Close', { duration: 2600 }); this.loadSubscribers(false); } else { this.snackBar.open(r?.message || 'Failed.', 'Close', { duration: 3200 }); } },
        error: (e) => { this.deletingIds.update(c => { const n = new Set(c); n.delete(subscriberId); return n; }); this.snackBar.open(e?.error?.message || 'Failed.', 'Close', { duration: 3200 }); },
      });
    });
  }

  exportCsv(): void {
    const rows = this.subscribers().map(r => {
      const s = r.store || {}; const o = r.storeOwner || {};
      return { email: r.email || '', status: r.status || '', source: r.source || '', subscribedAt: r.subscribedAt || '', firstSubscribedAt: r.firstSubscribedAt || '', deviceType: r.deviceType || '', storeName: s.name || '', storeLink: s.storeLink || '', ownerName: o.displayName || '', ownerUsername: o.username || '', ownerEmail: o.email || '', referrer: r.referrer || '' };
    });
    const header = Object.keys(rows[0] || { email: '' });
    const csv = [header.join(','), ...rows.map(r => header.map(k => JSON.stringify((r as any)[k] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `storefront-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  }
}
