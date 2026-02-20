// transactions.component.ts
import { Component, Input, Signal, computed, inject, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { CurrencyUtilsPipe, DeviceService, UserInterface } from '../../../../shared-services/src/public-api';
import { Transaction } from './transactions.model';
import { ShortenIdPipe } from './shorten-id.pipe';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatTableModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDividerModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormsModule,
    TitleCasePipe,
    ShortenIdPipe,
    CurrencyUtilsPipe
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;

  private deviceService = inject(DeviceService);
  deviceType = computed(() => this.deviceService.type());
  
  // Filter signals
  private currentFilter = signal<string>('all');
  private statusFilter = signal<string[]>([]);
  private searchFilter = signal<string>('');
  isLoading = signal<boolean>(false);
  
  // Get transactions based on user role
  transactions = computed(() => {
    const userData = this.user();
    if (!userData) return [];
    
    const walletType = userData.role === 'promoter' ? 'promoter' : 'marketer';
    const walletTransactions = userData.wallets?.[walletType]?.transactions;
    
    return Array.isArray(walletTransactions) ? [...walletTransactions].reverse() : [];
  });

  // Get balance based on user role
  currentBalance = computed(() => {
    const userData = this.user();
    if (!userData) return 0;
    
    const walletType = userData.role === 'promoter' ? 'promoter' : 'marketer';
    return userData.wallets?.[walletType]?.balance ?? 0;
  });

  // Get reserved funds based on user role
  currentReserved = computed(() => {
    const userData = this.user();
    if (!userData) return 0;
    
    const walletType = userData.role === 'promoter' ? 'promoter' : 'marketer';
    return userData.wallets?.[walletType]?.reserved ?? 0;
  });
  
  // Calculate total amount based on user role
  totalAmount = computed(() => {
    const userData = this.user();
    if (!userData) return 0;
    
    // For promoters, calculate total earnings (credits)
    if (userData.role === 'promoter') {
      return this.transactions()
        .filter(t => t.type === 'credit')
        .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);
    }
    
    // For marketers, calculate total spending (debits)
    return this.transactions()
      .filter(t => t.type === 'debit')
      .reduce((sum, transaction) => sum + (transaction.amount ?? 0), 0);
  });
  
  // Filtered transactions based on active filters
  filteredTransactions = computed(() => {
    let filtered = this.transactions();

    //console.log('transaction ',this.transactions())
    
    // Apply type filter
    if (this.currentFilter() !== 'all') {
      if (this.currentFilter() === 'credits') {
        filtered = filtered.filter(t => t.type === 'credit');
      } else if (this.currentFilter() === 'debits') {
        filtered = filtered.filter(t => t.type === 'debit');
      } else if (this.currentFilter() === 'campaigns') {
        filtered = filtered.filter(t => t.category === 'campaign');
      } else if (this.currentFilter() === 'earnings' && this.user()?.role === 'promoter') {
        filtered = filtered.filter(t => t.type === 'credit' && t.category === 'promotion');
      } else if (this.currentFilter() === 'spending' && this.user()?.role === 'marketer') {
        filtered = filtered.filter(t => t.type === 'debit' && (t.category === 'campaign' || t.category === 'promotion'));
      }
    }
    
    // Apply status filter
    if (this.statusFilter().length > 0) {
      filtered = filtered.filter(t => this.statusFilter().includes(t.status?.at(0) ?? ''));
    }
    
    // Apply search filter
    if (this.searchFilter()) {
      const searchTerm = this.searchFilter().toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm) || 
        t.amount?.toString().includes(searchTerm) ||
        t.category?.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  });
  
  // Check if any filters are active
  hasActiveFilters = computed(() => {
    return this.currentFilter() !== 'all' || 
           this.statusFilter().length > 0 || 
           this.searchFilter().length > 0;
  });
  
  // Define the columns to be displayed in the table
  displayedColumns: string[] = ['createdAt', 'description', 'amount', 'status'];
  
  constructor(private snackBar: MatSnackBar) {}
  
  // Filter transactions by tab selection
  filterTransactions(event: any): void {
    const tabIndex = event.index;
    const filters = ['all', 'credits', 'debits', 'campaigns', 
                     this.user()?.role === 'promoter' ? 'earnings' : 'spending'];
    this.currentFilter.set(filters[tabIndex]);
  }
  
  // Filter by status
  filterByStatus(event: any): void {
    this.statusFilter.set(event.value);
  }
  
  // Apply search filter
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.searchFilter.set(filterValue.trim().toLowerCase());
  }
  
  // Clear all filters
  clearFilters(): void {
    this.currentFilter.set('all');
    this.statusFilter.set([]);
    this.searchFilter.set('');
  }
  
  // Refresh transactions
  refreshTransactions(): void {
    this.isLoading.set(true);
    // Simulate API refresh
    setTimeout(() => {
      this.isLoading.set(false);
      this.snackBar.open('Transactions refreshed', 'Close', { duration: 2000 });
    }, 1000);
  }

  // formatCurrency(value: number): string {
  //   return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
  // }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-NG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-NG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getCategoryIcon(category: string): string {
    switch (category) {
      case 'deposit': return 'account_balance_wallet';
      case 'withdrawal': return 'payments';
      case 'campaign': return 'campaign';
      case 'promotion': return 'local_offer';
      case 'bonus': return 'card_giftcard';
      case 'fee': return 'receipt';
      case 'refund': return 'undo';
      default: return 'receipt_long';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'successful': return 'check_circle';
      case 'pending': return 'schedule';
      case 'failed': return 'error';
      default: return 'help_outline';
    }
  }
}