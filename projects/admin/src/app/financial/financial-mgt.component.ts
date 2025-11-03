// In financial-management.component.ts
import { Component, signal, computed, inject, OnInit } from '@angular/core';
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
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

// Import the service
import { FinancialService, Transaction, WithdrawalRequest, FinancialStats } from './financial.service';

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
  ],
  providers: [FinancialService]
})
export class FinancialMgtComponent implements OnInit {
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
    pendingWithdrawals: 0,
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

  // Filter and pagination
  readonly searchTerm = signal('');
  readonly statusFilter = signal<'all' | 'pending' | 'approved' | 'rejected'>('all');
  readonly currentPage = signal(0);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);

  private searchSubject = new Subject<string>();

  // Computed values
  readonly filteredWithdrawals = computed(() => {
    const requests = this.withdrawalRequests();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();

    let filtered = requests;

    if (search) {
      filtered = filtered.filter(request =>
        request.userName.toLowerCase().includes(search) ||
        request.userEmail.toLowerCase().includes(search) ||
        request.bankName.toLowerCase().includes(search) ||
        request.accountNumber.includes(search)
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(request => request.status === status);
    }

    this.totalItems.set(filtered.length);
    return filtered;
  });

  readonly paginatedWithdrawals = computed(() => {
    const filtered = this.filteredWithdrawals();
    const page = this.currentPage();
    const size = this.pageSize();

    return filtered.slice(page * size, (page + 1) * size);
  });

  // Table columns
  readonly withdrawalColumns = [
    'user',
    'amount',
    'bankDetails',
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
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(search => {
      this.searchTerm.set(search);
      this.currentPage.set(0);
    });
  }

  onSearchChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchSubject.next(value);
  }

  onStatusFilterChange(status: 'all' | 'pending' | 'approved' | 'rejected') {
    this.statusFilter.set(status);
    this.currentPage.set(0);
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  loadFinancialData() {
    this.isLoading.set(true);
    
    this.financialService.getFinancialOverview().subscribe({
      next: (data) => {
        this.financialStats.set(data.stats);
        this.transactions.set(data.recentTransactions);
        this.withdrawalRequests.set(data.pendingWithdrawals);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading financial data:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error loading financial data', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadWithdrawalRequests() {
    this.isWithdrawalsLoading.set(true);
    
    this.financialService.getWithdrawalRequests({
      status: this.statusFilter(),
      page: this.currentPage() + 1,
      limit: this.pageSize(),
      search: this.searchTerm()
    }).subscribe({
      next: (response) => {
        this.withdrawalRequests.set(response.requests);
        this.totalItems.set(response.total);
        this.isWithdrawalsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading withdrawal requests:', error);
        this.isWithdrawalsLoading.set(false);
      }
    });
  }

  approveWithdrawal(request: WithdrawalRequest) {
    this.financialService.approveWithdrawal(request.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local state
          this.withdrawalRequests.update(requests =>
            requests.map(r => r.id === request.id ? { ...r, status: 'approved' } : r)
          );
          
          this.snackBar.open('Withdrawal approved successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Reload stats to reflect changes
          this.loadFinancialData();
        }
      },
      error: (error) => {
        console.error('Error approving withdrawal:', error);
        this.snackBar.open('Error approving withdrawal', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  rejectWithdrawal(request: WithdrawalRequest) {
    // In a real implementation, you'd open a dialog for rejection notes
    const notes = 'Withdrawal rejected by administrator';
    
    this.financialService.rejectWithdrawal(request.id, notes).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local state
          this.withdrawalRequests.update(requests =>
            requests.map(r => r.id === request.id ? { ...r, status: 'rejected' } : r)
          );
          
          this.snackBar.open('Withdrawal rejected', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          
          // Reload stats to reflect changes
          this.loadFinancialData();
        }
      },
      error: (error) => {
        console.error('Error rejecting withdrawal:', error);
        this.snackBar.open('Error rejecting withdrawal', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  processWithdrawal(request: WithdrawalRequest) {
    this.financialService.processWithdrawal(request.id).subscribe({
      next: (response) => {
        if (response.success) {
          // Update local state
          this.withdrawalRequests.update(requests =>
            requests.map(r => r.id === request.id ? { ...r, status: 'processing' } : r)
          );
          
          this.snackBar.open('Withdrawal marked as processing', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Error processing withdrawal:', error);
        this.snackBar.open('Error processing withdrawal', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  exportTransactions() {
    this.financialService.exportTransactions({
      format: 'csv',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      endDate: new Date().toISOString()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Create download link
          const link = document.createElement('a');
          link.href = response.data.url;
          link.download = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          
          this.snackBar.open('Transactions exported successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Error exporting transactions:', error);
        this.snackBar.open('Error exporting transactions', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  exportWithdrawals() {
    this.financialService.exportWithdrawals({
      format: 'csv',
      status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Create download link
          const link = document.createElement('a');
          link.href = response.data.url;
          link.download = `withdrawals_export_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          
          this.snackBar.open('Withdrawals exported successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('Error exporting withdrawals:', error);
        this.snackBar.open('Error exporting withdrawals', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}