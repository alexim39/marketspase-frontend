import { Component, DestroyRef, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../../shared-services/src/public-api';

interface SmsRecord {
  _id: string;
  sender: { _id: string; displayName: string; email: string } | null;
  contact: { _id: string; displayName: string; phone: string; email: string } | null;
  message: string;
  messageLength: number;
  pageCount: number;
  costPerPage: number;
  totalCost: number;
  status: string;
  provider: string;
  providerMessageId: string;
  phone: string;
  contactName: string;
  createdAt: string;
}

interface SmsStats {
  totalCost: number;
  totalSent: number;
  totalFailed: number;
  totalPages: number;
}

@Component({
  selector: 'admin-sms-management',
  standalone: true,
  providers: [DatePipe, DecimalPipe],
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './sms-management.component.html',
  styleUrls: ['./sms-management.component.scss'],
})
export class SmsManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly datePipe = inject(DatePipe);
  private readonly numberPipe = inject(DecimalPipe);
  private readonly destroyRef = inject(DestroyRef);

  private readonly search$ = new Subject<string>();

  readonly records = signal<SmsRecord[]>([]);
  readonly stats = signal<SmsStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly searchQuery = signal('');
  readonly statusFilter = signal('all');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly senderFilter = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(25);
  readonly totalItems = signal(0);

  readonly expandedRow = signal<string | null>(null);

  readonly pageSizeOptions = [10, 25, 50, 100];
  readonly statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'sent', label: 'Sent' },
    { value: 'failed', label: 'Failed' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'undelivered', label: 'Undelivered' },
  ];

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalItems() / this.pageSize())));
  readonly totalRecords = computed(() =>
    (this.stats()?.totalSent || 0) + (this.stats()?.totalFailed || 0)
  );

  get fromRecord(): number {
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  get toRecord(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalItems());
  }

  readonly hasFilters = computed(() =>
    !!this.searchQuery() || this.statusFilter() !== 'all' || !!this.startDate() || !!this.endDate() || !!this.senderFilter()
  );

  ngOnInit(): void {
    this.loadHistory();

    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.currentPage.set(1); this.loadHistory(); });
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    let query = `api/v1/customers/sms/history?page=${this.currentPage()}&limit=${this.pageSize()}`;
    if (this.searchQuery()) query += `&search=${encodeURIComponent(this.searchQuery())}`;
    if (this.statusFilter() !== 'all') query += `&status=${encodeURIComponent(this.statusFilter())}`;
    if (this.startDate()) query += `&startDate=${encodeURIComponent(this.startDate())}`;
    if (this.endDate()) query += `&endDate=${encodeURIComponent(this.endDate())}`;
    if (this.senderFilter()) query += `&senderId=${encodeURIComponent(this.senderFilter())}`;

    this.apiService.get(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res.success) {
            this.records.set(res.data.records || []);
            this.stats.set(res.data.stats || null);
            this.totalItems.set(res.data.total || 0);
          } else {
            this.error.set('Failed to load SMS history');
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load SMS history.');
          this.loading.set(false);
          this.snackBar.open('Could not load SMS history.', 'Close', { duration: 3200 });
        },
      });
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadHistory();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('all');
    this.startDate.set('');
    this.endDate.set('');
    this.senderFilter.set('');
    this.search$.next('');
    this.currentPage.set(1);
    this.loadHistory();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadHistory();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadHistory();
  }

  toggleRow(id: string): void {
    this.expandedRow.update(curr => curr === id ? null : id);
  }

  get visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 2) end = Math.min(4, total - 1);
    if (current >= total - 1) start = Math.max(total - 3, 2);

    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-1);
    pages.push(total);
    return pages;
  }

  formatDate(iso: string): string {
    return this.datePipe.transform(iso, 'MMM d, y, h:mm a') || iso;
  }

  formatCost(n: number | undefined | null): string {
    if (n == null) return '—';
    return `₦${this.numberPipe.transform(n, '1.0-2')}`;
  }

  truncateMessage(msg: string, max = 80): string {
    if (!msg) return '';
    return msg.length > max ? msg.slice(0, max) + '…' : msg;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      sent: 'status-sent', failed: 'status-failed',
      delivered: 'status-delivered', undelivered: 'status-undelivered',
    };
    return map[status] || 'status-sent';
  }

  trackById(_index: number, item: SmsRecord): string {
    return item._id;
  }
}
