// file: refund.component.ts
import { Component, inject, OnInit, ViewChild, signal, DestroyRef, computed, Inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { lastValueFrom } from 'rxjs';

// Angular Material imports
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';  // For mat-autocomplete
import { MatOptionModule } from '@angular/material/core';
// Services
import { AdminService } from '../../common/services/user.service';
import { RefundService } from './refund.service';

// Types
export interface PromoterRefund {
  _id: string;
  transactionId: string;
  promoterId: string;
  promoterUsername: string;
  promoterEmail: string;
  amount: number;
  reason: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  processedBy: string;
  processedAt: Date;
  previousBalance: number;
  newBalance: number;
  metadata?: any;
}

export interface PromoterWallet {
  promoter: {
    id: string;
    username: string;
    email: string;
    role: string;
    accountAge: number;
    isActive: boolean;
    isVerified: boolean;
  };
  wallet: {
    balance: number;
    reserved: number;
    currency: string;
    totalTransactions: number;
    availableBalance: number;
  };
  recentTransactions: any[];
}

export interface BulkRefundItem {
  promoterUserId: string;
  promoterUsername?: string;
  promoterEmail?: string;
  amount: number;
  reason: string;
  status?: 'pending' | 'validating' | 'validated' | 'failed' | string;
  error?: string;
  transactionId?: string;
  data?: any;
}

// Dialog Components (simplified inline versions)
@Component({
  selector: 'app-refund-details-dialog',
  template: `
    <h2 mat-dialog-title>Refund Details</h2>
    <mat-dialog-content>
      <div *ngIf="data.refund">
        <div class="detail-row">
          <strong>Promoter:</strong> {{data.refund.promoterUsername}} ({{data.refund.promoterEmail}})
        </div>
        <div class="detail-row">
          <strong>Amount:</strong> {{data.refund.amount | currency:'NGN':'₦'}}
        </div>
        <div class="detail-row">
          <strong>Status:</strong> {{data.refund.status}}
        </div>
        <div class="detail-row">
          <strong>Processed At:</strong> {{data.refund.processedAt | date:'medium'}}
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, CurrencyPipe, DatePipe]
})
export class RefundDetailsDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { refund: any }) {}
}

@Component({
  selector: 'app-edit-bulk-item-dialog',
  template: `
    <h2 mat-dialog-title>Edit Refund Item</h2>
    <mat-dialog-content>
      <form [formGroup]="editForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Promoter ID</mat-label>
          <input matInput formControlName="promoterUserId" readonly>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Amount</mat-label>
          <input matInput type="number" formControlName="amount" min="1" max="1000000">
          <span matTextPrefix>₦&nbsp;</span>
        </mat-form-field>
        
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason</mat-label>
          <textarea matInput formControlName="reason" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-button color="primary" [mat-dialog-close]="editForm.value" [disabled]="editForm.invalid">Save</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    ReactiveFormsModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatButtonModule
  ]
})
export class EditBulkItemDialogComponent implements OnInit {
  editForm: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { item: any },
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      promoterUserId: [data.item.promoterUserId, Validators.required],
      amount: [data.item.amount, [Validators.required, Validators.min(1), Validators.max(1000000)]],
      reason: [data.item.reason, [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {}
}

// Import for MAT_DIALOG_DATA
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-promoter-refund',
  standalone: true,
  providers: [RefundService, AdminService, CurrencyPipe, DatePipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material Modules
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatExpansionModule,
    MatStepperModule,
    MatRadioModule,
    MatCheckboxModule,
    MatTabsModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatAutocompleteModule,
    MatOptionModule,
    // Dialog components
    RefundDetailsDialogComponent,
    EditBulkItemDialogComponent
  ],
  templateUrl: './refund.component.html',
  styleUrls: ['./refund.component.scss'],
})
export class RefundComponent implements OnInit {
  // Injections
  private readonly adminRefundService = inject(RefundService);
  private readonly adminService = inject(AdminService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currencyPipe = inject(CurrencyPipe);
  private readonly datePipe = inject(DatePipe);

  // State
  readonly isLoading = signal(false);
  readonly isProcessing = signal(false);
  readonly isBulkProcessing = signal(false);
  readonly activeTab = signal<'single' | 'bulk' | 'history'>('single');
  
  // Single refund state
  readonly selectedPromoter = signal<any>(null);
  readonly validationResult = signal<any>(null);
  readonly refundHistory = signal<PromoterRefund[]>([]);
  readonly totalRefundAmount = computed(() => 
    this.refundHistory().reduce((sum, refund) => sum + refund.amount, 0)
  );

  // Bulk refund state
  readonly bulkRefundItems = signal<BulkRefundItem[]>([]);
  readonly bulkValidationResults = signal<any[]>([]);
  readonly bulkProcessingProgress = signal(0);

  // Search and filters
  readonly searchQuery = signal('');
  readonly promoters = signal<any[]>([]);
  readonly filteredPromoters = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return [];
    
    return this.promoters().filter(promoter =>
      promoter.username?.toLowerCase().includes(query) ||
      promoter.email?.toLowerCase().includes(query) ||
      promoter.displayName?.toLowerCase().includes(query)
    );
  });

  // Table data sources
  readonly refundHistoryDataSource = new MatTableDataSource<PromoterRefund>([]);
  readonly bulkRefundDataSource = new MatTableDataSource<BulkRefundItem>([]);
  
  readonly displayedColumns = [
    'promoter', 
    'amount', 
    'reason', 
    'status', 
    'processedBy', 
    'processedAt', 
    'actions'
  ];
  
  readonly bulkDisplayedColumns = [
    'promoter', 
    'amount', 
    'reason', 
    'status', 
    'actions'
  ];

  // Forms
  readonly singleRefundForm = this.fb.group({
    promoterIdentifier: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(1), Validators.max(1000000)]],
    reason: ['', [Validators.required, Validators.minLength(10)]],
    notes: [''],
    sendNotification: [true]
  });

  readonly bulkRefundForm = this.fb.group({
    refundsFile: [null],
    refundsText: [''],
    defaultReason: ['Bulk refund adjustment'],
    sendNotifications: [true]
  });

  readonly filtersForm = this.fb.group({
    dateRange: [null],
    promoter: [''],
    minAmount: [null],
    maxAmount: [null],
    status: ['']
  });

  // View Children
  @ViewChild('historyPaginator') historyPaginator!: MatPaginator;
  @ViewChild('historySort') historySort!: MatSort;
  @ViewChild('bulkPaginator') bulkPaginator!: MatPaginator;
  @ViewChild('bulkSort') bulkSort!: MatSort;

  // File upload
  readonly fileInput = signal<File | null>(null);

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadRefundHistory();
    this.setupFormSubscriptions();
  }

  // Form setup
  private setupFormSubscriptions(): void {
    // Single refund form - promoter identifier search
    this.singleRefundForm.get('promoterIdentifier')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (value && value.length >= 2) {
          this.searchPromoters(value);
        } else {
          this.promoters.set([]);
        }
      });

    // Single refund form - amount validation
    this.singleRefundForm.get('amount')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(amount => {
        if (amount && amount > 1000000) {
          this.singleRefundForm.get('amount')?.setErrors({ max: true });
        }
      });

    // Filters form
    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());
  }

  // Search methods
  searchPromoters(query: string): void {
    if (!query || query.length < 2) {
      this.promoters.set([]);
      return;
    }

    this.isLoading.set(true);
    this.searchQuery.set(query);
    
    this.adminRefundService.searchPromoters(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.promoters.set(response.data || []);
          } else {
            this.showError(response.message || 'Search failed');
            this.promoters.set([]);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error searching promoters:', error);
          // Don't show error for 404 - just clear results
          if (error.status !== 404) {
            this.showError('Search failed. Please try again.');
          }
          this.promoters.set([]);
          this.isLoading.set(false);
        }
      });
  }

  selectPromoter(promoter: any): void {
    this.selectedPromoter.set(promoter);
    this.singleRefundForm.patchValue({
      promoterIdentifier: promoter.username || promoter.email || promoter._id
    });
    this.promoters.set([]); // Clear search results
    this.validateSingleRefund();
  }

  // Validation methods
  validateSingleRefund(): void {
    const formValue = this.singleRefundForm.value;
    if (!formValue.promoterIdentifier || !formValue.amount || formValue.amount <= 0) {
      this.validationResult.set({ valid: false, error: 'Enter promoter and amount' });
      return;
    }

    this.isLoading.set(true);
    this.adminRefundService.validateRefund(
      formValue.promoterIdentifier,
      formValue.amount
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.validationResult.set(response.data);
            if (!response.data?.valid) {
              this.singleRefundForm.setErrors({ validation: response.data?.error });
            }
          } else {
            this.validationResult.set({ valid: false, error: response.message });
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Validation error:', error);
          this.validationResult.set({ 
            valid: false, 
            error: error.message || 'Validation failed' 
          });
          this.isLoading.set(false);
        }
      });
  }

  validateBulkRefunds(): void {
    const items = this.bulkRefundItems();
    if (items.length === 0) return;

    this.isLoading.set(true);
    this.bulkProcessingProgress.set(0);

    const validationPromises = items.map((item, index) => 
      lastValueFrom(this.adminRefundService.validateRefund(item.promoterUserId, item.amount))
        .then(response => {
          this.bulkProcessingProgress.set(((index + 1) / items.length) * 100);
          return { 
            ...item, 
            validation: response.data,
            status: response.data.valid ? 'validated' : 'failed',
            error: response.data.error 
          };
        })
        .catch(error => ({ 
          ...item, 
          validation: { valid: false, error: error.message },
          status: 'failed',
          error: error.message 
        }))
    );

    Promise.all(validationPromises)
      .then(results => {
        this.bulkValidationResults.set(results);
        
        const invalidItems = results.filter(r => !r.validation.valid);
        if (invalidItems.length > 0) {
          this.showError(`${invalidItems.length} items failed validation`);
        }
        
        this.bulkRefundItems.set(results);
        this.bulkRefundDataSource.data = results;
        
        this.isLoading.set(false);
        this.bulkProcessingProgress.set(0);
      })
      .catch(error => {
        console.error('Bulk validation error:', error);
        this.isLoading.set(false);
        this.bulkProcessingProgress.set(0);
      });
  }

  // Refund processing methods
  processSingleRefund(): void {
    if (this.singleRefundForm.invalid) {
      this.markFormGroupTouched(this.singleRefundForm);
      return;
    }

    const formValue = this.singleRefundForm.value;
    const adminId = this.adminService.adminData()?._id;

    if (!adminId) {
      this.showError('Admin not authenticated');
      return;
    }

    this.isProcessing.set(true);

    this.adminRefundService.refundPromoterBalance({
      promoterUserId: formValue.promoterIdentifier!,
      amount: formValue.amount!,
      reason: formValue.reason!,
      adminId: adminId,
      metadata: {
        notes: formValue.notes,
        sendNotification: formValue.sendNotification,
        processedFrom: 'admin-dashboard'
      }
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess(response.message || `Successfully refunded ${formValue.amount} to promoter`);
            this.resetSingleRefundForm();
            this.loadRefundHistory();
            
            if (this.selectedPromoter()) {
              this.loadPromoterWalletDetails(this.selectedPromoter()._id);
            }
          } else {
            this.showError(response.message || 'Refund failed');
          }
          this.isProcessing.set(false);
        },
        error: (error) => {
          console.error('Refund error:', error);
          this.showError(error.message || 'Refund failed');
          this.isProcessing.set(false);
        }
      });
  }

  processBulkRefunds(): void {
    const items = this.bulkRefundItems();
    if (items.length === 0) {
      this.showError('No refund items to process');
      return;
    }

    const adminId = this.adminService.adminData()?._id;
    if (!adminId) {
      this.showError('Admin not authenticated');
      return;
    }

    const validItems = items.filter(item => 
      item.status !== 'failed' && item.status !== 'validating'
    );

    if (validItems.length === 0) {
      this.showError('No valid items to process');
      return;
    }

    this.isBulkProcessing.set(true);
    this.bulkProcessingProgress.set(0);

    const processPromises = validItems.map((item, index) => 
      lastValueFrom(this.adminRefundService.refundPromoterBalance({
        promoterUserId: item.promoterUserId,
        amount: item.amount,
        reason: item.reason || 'Bulk refund',
        adminId: adminId,
        metadata: {
          bulkRefund: true,
          batchId: `bulk-${Date.now()}`
        }
      }))
        .then(response => {
          this.bulkProcessingProgress.set(((index + 1) / validItems.length) * 100);
          return { ...item, result: response };
        })
        .catch(error => ({ 
          ...item, 
          result: { success: false, error: error.message } 
        }))
    );

    Promise.all(processPromises)
      .then(results => {
        const successful = results.filter(r => r.result?.success);
        const failed = results.filter(r => !r.result?.success);
        
        this.showSuccess(
          `Processed ${results.length} refunds: ${successful.length} successful, ${failed.length} failed`
        );

        const updatedItems: BulkRefundItem[] = this.bulkRefundItems().map(item => {
          const result = results.find(r => r.promoterUserId === item.promoterUserId);
          return result ? {
            ...item,
            status: result.result?.success ? 'validated' : 'failed',
            error: 'error' in result.result ? result.result.error : undefined,
            transactionId: 'data' in result.result ? result.result.data?.transactionId : undefined
          } as BulkRefundItem : item;
        });

        this.bulkRefundItems.set(updatedItems);
        this.bulkRefundDataSource.data = updatedItems;
        
        this.loadRefundHistory();
        
        this.isBulkProcessing.set(false);
        this.bulkProcessingProgress.set(0);
      })
      .catch(error => {
        console.error('Bulk processing error:', error);
        this.showError('Bulk processing failed');
        this.isBulkProcessing.set(false);
        this.bulkProcessingProgress.set(0);
      });
  }

  // Bulk import methods
  handleFileUpload(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.fileInput.set(file);

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      this.parseCSVFile(file);
    } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
      this.parseJSONFile(file);
    } else {
      this.showError('Unsupported file format. Please upload CSV or JSON.');
    }
  }

  parseCSVFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      this.parseCSVText(csvText);
    };
    reader.readAsText(file);
  }

  parseJSONFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        this.parseJSONData(jsonData);
      } catch (error) {
        this.showError('Invalid JSON format');
      }
    };
    reader.readAsText(file);
  }

  parseCSVText(csvText: string): void {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      this.showError('CSV file is empty or invalid');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const items: BulkRefundItem[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const item: BulkRefundItem = {
        promoterUserId: '',
        amount: 0,
        reason: this.bulkRefundForm.get('defaultReason')?.value || 'Bulk refund'
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'promoterid':
          case 'userid':
          case 'id':
            item.promoterUserId = value;
            break;
          case 'username':
            item.promoterUsername = value;
            break;
          case 'email':
            item.promoterEmail = value;
            break;
          case 'amount':
            item.amount = parseFloat(value) || 0;
            break;
          case 'reason':
            if (value) item.reason = value;
            break;
        }
      });

      if (item.promoterUserId && item.amount > 0) {
        items.push({ ...item, status: 'pending' as 'pending' });
      }
    }

    this.bulkRefundItems.set(items);
    this.bulkRefundDataSource.data = items;
    this.showSuccess(`Imported ${items.length} refund items`);
  }

  parseJSONData(jsonData: any): void {
    if (!Array.isArray(jsonData)) {
      this.showError('JSON data must be an array');
      return;
    }

    const items: BulkRefundItem[] = jsonData.map((item: any) => ({
      promoterUserId: item.promoterUserId || item.userId || item.id || '',
      promoterUsername: item.promoterUsername || item.username,
      promoterEmail: item.promoterEmail || item.email,
      amount: item.amount || 0,
      reason: item.reason || this.bulkRefundForm.get('defaultReason')?.value || 'Bulk refund',
      status: 'pending' as 'pending'
    })).filter((item: BulkRefundItem) => item.promoterUserId && item.amount > 0);

    this.bulkRefundItems.set(items);
    this.bulkRefundDataSource.data = items;
    this.showSuccess(`Imported ${items.length} refund items`);
  }

  // Data loading methods
  loadRefundHistory(): void {
    this.isLoading.set(true);
    
    this.adminRefundService.getRefundHistory({
      limit: 50,
      page: 1
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Fix: Check if response.data exists before accessing
            const transactions = response.data?.refunds?.transactions || [];
            const mappedTransactions = transactions.map(transaction => ({
              ...transaction,
              _id: transaction._id || transaction.transactionId,
              status: (transaction.status || 'completed') as 'completed' | 'pending' | 'failed' | 'cancelled'
            }));
            
            this.refundHistory.set(mappedTransactions);
            this.refundHistoryDataSource.data = mappedTransactions;
          } else {
            this.showError(response.message || 'Failed to load refund history');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading refund history:', error);
          this.showError('Failed to load refund history');
          this.isLoading.set(false);
        }
      });
  }

  loadPromoterWalletDetails(promoterId: string): void {
    this.isLoading.set(true);
    
    this.adminRefundService.getPromoterWalletDetails(promoterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedPromoter.set(response.data.promoter);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading wallet details:', error);
          this.isLoading.set(false);
        }
      });
  }

  // Table and filter methods
  applyFilters(): void {
    const filters = this.filtersForm.value;
    let filteredData = [...this.refundHistory()];

    if (filters.dateRange) {
      const startDate = new Date(filters.dateRange[0]);
      const endDate = new Date(filters.dateRange[1]);
      endDate.setHours(23, 59, 59, 999);

      filteredData = filteredData.filter(refund => {
        const processedDate = new Date(refund.processedAt);
        return processedDate >= startDate && processedDate <= endDate;
      });
    }

    if (filters.promoter) {
      filteredData = filteredData.filter(refund =>
        refund.promoterUsername?.toLowerCase().includes(filters.promoter!.toLowerCase()) ||
        refund.promoterEmail?.toLowerCase().includes(filters.promoter!.toLowerCase())
      );
    }

    if (filters.minAmount) {
      filteredData = filteredData.filter(refund => refund.amount >= filters.minAmount!);
    }

    if (filters.maxAmount) {
      filteredData = filteredData.filter(refund => refund.amount <= filters.maxAmount!);
    }

    if (filters.status) {
      filteredData = filteredData.filter(refund => refund.status === filters.status);
    }

    this.refundHistoryDataSource.data = filteredData;
  }

  clearFilters(): void {
    this.filtersForm.reset();
    this.refundHistoryDataSource.data = this.refundHistory();
  }

  // Utility methods - REMOVE 'private' keyword since they're called from template
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  resetSingleRefundForm(): void {
    this.singleRefundForm.reset({
      promoterIdentifier: '',
      amount: 0,
      reason: '',
      notes: '',
      sendNotification: true
    });
    this.selectedPromoter.set(null);
    this.validationResult.set(null);
  }

  showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', { 
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // Helper getters for templates
  get promoterDisplayName(): string {
    const promoter = this.selectedPromoter();
    if (!promoter) return 'Select a promoter';
    return promoter.displayName || promoter.username || promoter.email || 'Unknown';
  }

  get validationStatus(): string {
    const result = this.validationResult();
    if (!result) return 'pending';
    return result.valid ? 'valid' : 'invalid';
  }

  get validationMessage(): string {
    const result = this.validationResult();
    if (!result) return 'Enter promoter and amount to validate';
    return result.valid ? '✓ Refund is valid' : `✗ ${result.error}`;
  }

  get totalBulkAmount(): number {
    return this.bulkRefundItems().reduce((sum, item) => sum + item.amount, 0);
  }

  get formattedTotalBulkAmount(): string {
    return this.currencyPipe.transform(this.totalBulkAmount, 'NGN', '₦') || '';
  }

  // Table actions
  viewRefundDetails(refund: PromoterRefund): void {
    this.dialog.open(RefundDetailsDialogComponent, {
      width: '600px',
      data: { refund }
    });
  }

  cancelBulkItem(item: BulkRefundItem): void {
    const updatedItems = this.bulkRefundItems().filter(i => 
      i.promoterUserId !== item.promoterUserId
    );
    this.bulkRefundItems.set(updatedItems);
    this.bulkRefundDataSource.data = updatedItems;
  }

  editBulkItem(item: BulkRefundItem): void {
    const dialogRef = this.dialog.open(EditBulkItemDialogComponent, {
      width: '500px',
      data: { item }
    });

    dialogRef.afterClosed().subscribe(updatedItem => {
      if (updatedItem) {
        const updatedItems = this.bulkRefundItems().map(i =>
          i.promoterUserId === updatedItem.promoterUserId ? updatedItem : i
        );
        this.bulkRefundItems.set(updatedItems);
        this.bulkRefundDataSource.data = updatedItems;
      }
    });
  }

  // Download templates
  downloadCSVTemplate(): void {
    const template = `promoterUserId,username,email,amount,reason\nPROMOTER_ID_1,username1,email1@example.com,5000,Bulk refund\nPROMOTER_ID_2,username2,email2@example.com,3000,Bulk refund`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-refund-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadJSONTemplate(): void {
    const template = [
      {
        promoterUserId: "PROMOTER_ID_1",
        username: "username1",
        email: "email1@example.com",
        amount: 5000,
        reason: "Bulk refund"
      },
      {
        promoterUserId: "PROMOTER_ID_2",
        username: "username2",
        email: "email2@example.com",
        amount: 3000,
        reason: "Bulk refund"
      }
    ];
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-refund-template.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  downloadRefundReceipt(refund: PromoterRefund): void {
    this.isLoading.set(true);
    
    this.adminRefundService.downloadRefundReceipt(refund.transactionId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: (response) => {
            if (response.success && response.data.receiptUrl) {
            window.open(response.data.receiptUrl, '_blank');
            } else {
            this.showError('Receipt not available');
            }
            this.isLoading.set(false);
        },
        error: (error) => {
            console.error('Error downloading receipt:', error);
            this.showError('Failed to download receipt');
            this.isLoading.set(false);
        }
        });
  }

  onTabChange(index: number): void {
    switch (index) {
      case 0:
        this.activeTab.set('single');
        break;
      case 1:
        this.activeTab.set('bulk');
        break;
      case 2:
        this.activeTab.set('history');
        break;
    }
  }
}