// financial-management.component.ts
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
import { Subject, debounceTime, distinctUntilChanged, Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { FinancialService, Transaction, WithdrawalRequest, FinancialStats } from './financial.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { WithdrawalDetailsDialogComponent } from './withdrawal-details-dialog/withdrawal-details-dialog.component';

@Component({
  selector: 'app-financial-management',
  templateUrl: './financial-mgt.component.html',
  styleUrls: ['./financial-mgt.component.scss'],
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
  ],
  providers: [FinancialService]
})
export class FinancialMgtComponent implements OnInit, OnDestroy {
  private readonly financialService = inject(FinancialService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for state management
  readonly transactions = signal<Transaction[]>([]);
  readonly withdrawalRequests = signal<WithdrawalRequest[]>([]);
  readonly financialStats = signal<FinancialStats>({
    totalRevenue: 0,
    platformEarnings: 0,
    totalWithdrawals: 0,
    successfulWithdrawals: 0,
    failedWithdrawals: 0,
    pendingWithdrawals: 0,
    processingWithdrawals: 0,
    marketerSpend: 0,
    promoterEarnings: 0,
    activeBalance: 0,
    reservedBalance: 0,
    totalTransactions: 0,
    successfulTransactions: 0
  });

  readonly isLoading = signal(true);
  readonly isWithdrawalsLoading = signal(true);
  readonly isTransactionsLoading = signal(true);

  // Filter and pagination - ALL SERVER-SIDE NOW
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | 'processing' | 'successful' | 'failed' | 'reversed' | 'pending_approval'>('all');
  readonly dateRange = signal<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  readonly currentPage = signal(0);
  readonly pageSize = signal(50);
  readonly totalItems = signal(0);

  private searchSubject = new Subject<string>();
  private pollingSubscription?: Subscription;

  // Status badge mapping
  readonly statusConfig: Record<string, { class: string; icon: string; label: string }> = {
    'pending_approval': { class: 'status-warning', icon: 'hourglass_empty', label: 'Pending Approval' },
    'processing': { class: 'status-info', icon: 'pending', label: 'Processing' },
    'successful': { class: 'status-success', icon: 'check_circle', label: 'Completed' },
    'failed': { class: 'status-danger', icon: 'error', label: 'Failed' },
    'reversed': { class: 'status-default', icon: 'swap_horiz', label: 'Reversed' }
  };

  // SIMPLIFIED: Just return the current page data (already paginated from server)
  readonly paginatedWithdrawals = computed(() => {
    return this.withdrawalRequests(); // Server already paginates
  });

  // Stats calculations (still client-side, works on current page data)
  readonly totalProcessingAmount = computed(() => {
    return this.withdrawalRequests()
      .filter(r => r.status === 'processing')
      .reduce((sum, r) => sum + r.amount, 0);
  });

  readonly totalSuccessfulAmount = computed(() => {
    return this.withdrawalRequests()
      .filter(r => r.status === 'successful')
      .reduce((sum, r) => sum + r.amount, 0);
  });

  readonly totalFailedAmount = computed(() => {
    return this.withdrawalRequests()
      .filter(r => r.status === 'failed')
      .reduce((sum, r) => sum + r.amount, 0);
  });

  // Table columns
  readonly withdrawalColumns = [
    'user',
    'amount',
    'amountPayable',
    'bankDetails',
    'reference',
    'status',
    'date',
    'actions'
  ];

  readonly transactionColumns = [
    'user',
    'type',
    'amount',
    'category',
    'description',
    'status',
    'date'
  ];

  ngOnInit() {
    this.loadFinancialData();
    this.setupSearch();
    this.loadWithdrawalRequests();
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
      this.currentPage.set(0); // Reset to first page
      this.loadWithdrawalRequests(); // Reload with new search
    });
  }

  private setupRealTimeUpdates() {
    // Poll for updates every 30 seconds
    this.pollingSubscription = interval(30000).subscribe(() => {
      this.loadWithdrawalRequests(true); // silent reload
    });
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onStatusFilterChange(status: 'all' | 'processing' | 'successful' | 'failed' | 'reversed' | 'pending_approval') {
    this.statusFilter.set(status);
    this.currentPage.set(0); // Reset to first page
    this.loadWithdrawalRequests(); // Reload with new filter
  }

  onDateRangeChange(start: Date, end: Date) {
    this.dateRange.set({ start, end });
    this.currentPage.set(0);
    this.loadWithdrawalRequests();
  }

  clearFilters() {
    this.searchTerm.set('');
    this.statusFilter.set('all');
    this.dateRange.set({ start: null, end: null });
    this.currentPage.set(0);
    this.loadWithdrawalRequests(); // Reload with cleared filters
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadWithdrawalRequests(); // Load new page from server
  }

  loadFinancialData() {
    this.isLoading.set(true);

    this.financialService.getFinancialOverview().subscribe({
      next: (data) => {
        this.financialStats.set(data.stats);
        this.transactions.set(data.recentTransactions || []);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading financial data:', error);
        this.isLoading.set(false);
        this.showError('Error loading financial data');
      }
    });
  }

  loadWithdrawalRequests(silent: boolean = false) {
    if (!silent) {
      this.isWithdrawalsLoading.set(true);
    }

    // Convert status 'all' to undefined so server returns all statuses
    const status = this.statusFilter() === 'all' ? undefined : this.statusFilter();
    
    const params: any = {
      page: this.currentPage() + 1, // backend uses 1-indexed page
      limit: this.pageSize(),
    };
    
    // Only add params if they have values
    if (status) params.status = status;
    if (this.searchTerm()) params.search = this.searchTerm();
    if (this.dateRange().start) params.fromDate = this.dateRange().start?.toISOString();
    if (this.dateRange().end) params.toDate = this.dateRange().end?.toISOString();

    //console.log('Loading withdrawals with params:', params); // Debug log

    this.financialService.getWithdrawalRequests(params).subscribe({
      next: (response) => {
        //console.log('Withdrawals response:', response); // Debug log
        
        const requests = response?.requests ?? [];
        const total = response?.total ?? 0;

        this.withdrawalRequests.set(requests);
        this.totalItems.set(total);
        
        if (!silent) {
          this.isWithdrawalsLoading.set(false);
        }
      },
      error: (error) => {
        console.error('Error loading withdrawal requests:', error);
        if (!silent) {
          this.isWithdrawalsLoading.set(false);
          this.showError('Error loading withdrawal requests');
        }
      }
    });
  }

  viewWithdrawalDetails(request: WithdrawalRequest) {
    const dialogRef = this.dialog.open(WithdrawalDetailsDialogComponent, {
       //width: '100vw',        // Sets the width to 100% of the viewport width
        maxWidth: '100vw', 
      data: { withdrawalId: request.withdrawalId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.updated) {
        this.loadWithdrawalRequests(true);
        this.loadFinancialData();
      }
    });
  }

  approveWithdrawal(request: WithdrawalRequest) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Approve Withdrawal',
        message: `Are you sure you want to approve withdrawal of ₦${request.amount.toLocaleString()} for ${request.userName}?`,
        confirmText: 'Approve',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.financialService.approveWithdrawal(request.withdrawalId).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Withdrawal approved successfully');
              this.loadWithdrawalRequests(true);
              this.loadFinancialData();
            }
          },
          error: (error) => this.showError('Error approving withdrawal')
        });
      }
    });
  }

  rejectWithdrawal(request: WithdrawalRequest) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Reject Withdrawal',
        message: `Are you sure you want to reject withdrawal of ₦${request.amount.toLocaleString()} for ${request.userName}?`,
        confirmText: 'Reject',
        cancelText: 'Cancel',
        input: {
          label: 'Reason for rejection',
          required: true,
          type: 'textarea'
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed && result?.input) {
        this.financialService.rejectWithdrawal(request.withdrawalId, result.input).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Withdrawal rejected successfully');
              this.loadWithdrawalRequests(true);
              this.loadFinancialData();
            }
          },
          error: (error) => this.showError('Error rejecting withdrawal')
        });
      }
    });
  }

  retryWithdrawal(request: WithdrawalRequest) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Retry Withdrawal',
        message: `Are you sure you want to retry this failed withdrawal for ₦${request.amount.toLocaleString()}?`,
        confirmText: 'Retry',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.financialService.retryWithdrawal(request.withdrawalId).subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Withdrawal retry initiated');
              this.loadWithdrawalRequests(true);
            }
          },
          error: (error) => this.showError('Error retrying withdrawal')
        });
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

  exportWithdrawals() {
    this.financialService.exportWithdrawals({
      format: 'csv',
      status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
      startDate: this.dateRange().start?.toISOString(),
      endDate: this.dateRange().end?.toISOString()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          const link = document.createElement('a');
          link.href = response.data.url;
          link.download = `withdrawals_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          this.showSuccess('Withdrawals exported successfully');
        }
      },
      error: (error) => this.showError('Error exporting withdrawals')
    });
  }

  exportTransactions() {
    // Implement if needed
    this.showError('Export transactions not implemented');
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

  onTabChange(event: any): void {
    if (event.index === 0) { // Withdrawals tab
      this.loadWithdrawalRequests();
    } else if (event.index === 1) { // Transactions tab
      this.loadTransactions();
    }
  }

  loadTransactions(): void {
    this.isTransactionsLoading.set(true);
    
    this.financialService.getTransactions({
      page: 1,
      limit: 50
    }).subscribe({
      next: (response) => {
        this.transactions.set(response.transactions);
        this.isTransactionsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isTransactionsLoading.set(false);
        this.showError('Error loading transactions');
      }
    });
  }
}