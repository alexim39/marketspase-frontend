// transfer-transactions.component.ts
import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, debounceTime, distinctUntilChanged, Subscription, interval } from 'rxjs';

import { TransferService, TransferTransaction, TransferStats } from './transfer.service';
import { TransferDetailsDialogComponent } from './transfer-details-dialog/transfer-details-dialog.component';

@Component({
  selector: 'app-transfer-transactions',
  templateUrl: './transfer-transactions.component.html',
  styleUrls: ['./transfer-transactions.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatCardModule,
    MatTabsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule
  ],
  providers: [TransferService]
})
export class TransferTransactionsComponent implements OnInit, OnDestroy {
  private readonly transferService = inject(TransferService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for state management
  readonly transfers = signal<TransferTransaction[]>([]);
  readonly transferStats = signal<TransferStats>({
    totalTransfers: 0,
    totalAmount: 0,
    selfTransfers: 0,
    otherTransfers: 0,
    toMarketerWallet: 0,
    toPromoterWallet: 0,
    lockedAmount: 0
  });

  readonly isLoading = signal(true);
  readonly isTransfersLoading = signal(true);

  // Filter and pagination
  readonly searchTerm = signal('');
  readonly transferTypeFilter = signal<'all' | 'self' | 'other'>('all');
  readonly destinationFilter = signal<'all' | 'marketer' | 'promoter'>('all');
  readonly dateRange = signal<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  readonly currentPage = signal(0);
  readonly pageSize = signal(50);
  readonly totalItems = signal(0);

  private searchSubject = new Subject<string>();
  private pollingSubscription?: Subscription;

  // Status badge mapping
  readonly statusConfig: Record<string, { class: string; icon: string; label: string }> = {
    'completed': { class: 'status-success', icon: 'check_circle', label: 'Completed' },
    'pending': { class: 'status-pending', icon: 'hourglass_empty', label: 'Pending' },
    'failed': { class: 'status-failed', icon: 'error', label: 'Failed' },
    'reversed': { class: 'status-reversed', icon: 'settings_backup_restore', label: 'Reversed' }
  };

  // Computed values
  readonly paginatedTransfers = computed(() => this.transfers());

  readonly totalSelfTransferAmount = computed(() => {
    return this.transfers()
      .filter(t => t.transferType === 'self')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  readonly totalOtherTransferAmount = computed(() => {
    return this.transfers()
      .filter(t => t.transferType === 'other')
      .reduce((sum, t) => sum + t.amount, 0);
  });

  readonly totalLockedAmount = computed(() => {
    return this.transfers()
      .filter(t => t.marketerLocked === true)
      .reduce((sum, t) => sum + t.amount, 0);
  });

  // Table columns
  readonly transferColumns = [
    'transferType',
    'fromUser',
    'toUser',
    'amount',
    'destinationWallet',
    'lockedStatus',
    'reference',
    'status',
    'date',
    'actions'
  ];

  ngOnInit() {
    this.loadTransferStats();
    this.loadTransfers();
    this.setupSearch();
    this.setupRealTimeUpdates();
  }

  ngOnDestroy() {
    this.pollingSubscription?.unsubscribe();
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.searchTerm.set(search);
      this.currentPage.set(0);
      this.loadTransfers();
    });
  }

  private setupRealTimeUpdates() {
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.loadTransfers(true);
    });
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onTransferTypeFilterChange(type: 'all' | 'self' | 'other') {
    this.transferTypeFilter.set(type);
    this.currentPage.set(0);
    this.loadTransfers();
  }

  onDestinationFilterChange(destination: 'all' | 'marketer' | 'promoter') {
    this.destinationFilter.set(destination);
    this.currentPage.set(0);
    this.loadTransfers();
  }

  onDateRangeChange(start: Date, end: Date) {
    this.dateRange.set({ start, end });
    this.currentPage.set(0);
    this.loadTransfers();
  }

  clearFilters() {
    this.searchTerm.set('');
    this.transferTypeFilter.set('all');
    this.destinationFilter.set('all');
    this.dateRange.set({ start: null, end: null });
    this.currentPage.set(0);
    this.loadTransfers();
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadTransfers();
  }

  loadTransferStats() {
    this.transferService.getTransferStats().subscribe({
      next: (response) => {
        this.transferStats.set(response.data);
      },
      error: (error) => {
        console.error('Error loading transfer stats:', error);
      }
    });
  }

  loadTransfers(silent: boolean = false) {
    if (!silent) {
      this.isTransfersLoading.set(true);
    }

    const params: any = {
      page: this.currentPage() + 1,
      limit: this.pageSize(),
    };

    if (this.transferTypeFilter() !== 'all') {
      params.transferType = this.transferTypeFilter();
    }
    if (this.destinationFilter() !== 'all') {
      params.destinationType = this.destinationFilter();
    }
    if (this.searchTerm()) {
      params.search = this.searchTerm();
    }
    if (this.dateRange().start) {
      params.fromDate = this.dateRange().start?.toISOString();
    }
    if (this.dateRange().end) {
      params.toDate = this.dateRange().end?.toISOString();
    }

    this.transferService.getTransfers(params).subscribe({
      next: (response) => {
        this.transfers.set(response.transfers || []);
        this.totalItems.set(response.total || 0);
        if (!silent) {
          this.isTransfersLoading.set(false);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading transfers:', error);
        if (!silent) {
          this.isTransfersLoading.set(false);
          this.showError('Error loading transfer transactions');
        }
        this.isLoading.set(false);
      }
    });
  }

  viewTransferDetails(transfer: TransferTransaction) {
    const dialogRef = this.dialog.open(TransferDetailsDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { transferId: transfer.transferId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.updated) {
        this.loadTransfers(true);
        this.loadTransferStats();
      }
    });
  }

  getStatusClass(status: string): string {
    return this.statusConfig[status]?.class || 'status-default';
  }

  getStatusIcon(status: string): string {
    return this.statusConfig[status]?.icon || 'help';
  }

  getStatusLabel(status: string): string {
    return this.statusConfig[status]?.label || status;
  }

  getTransferTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'self': 'Self Transfer',
      'other': 'Transfer to Other'
    };
    return labels[type] || type;
  }

  getTransferTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'self': 'account_balance_wallet',
      'other': 'send'
    };
    return icons[type] || 'swap_horiz';
  }

  exportTransfers() {
    this.transferService.exportTransfers({
      format: 'csv',
      transferType: this.transferTypeFilter() === 'all' ? undefined : this.transferTypeFilter(),
      destinationType: this.destinationFilter() === 'all' ? undefined : this.destinationFilter(),
      startDate: this.dateRange().start?.toISOString(),
      endDate: this.dateRange().end?.toISOString()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          const link = document.createElement('a');
          link.href = response.data.url;
          link.download = `transfers_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          this.showSuccess('Transfers exported successfully');
        }
      },
      error: (error) => this.showError('Error exporting transfers')
    });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}