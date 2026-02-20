// withdrawal-details-dialog/withdrawal-details-dialog.component.ts
import { Component, Inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { FinancialService, WithdrawalRequest } from '../financial.service';

export interface WithdrawalDetailsData {
  withdrawalId: string;
}

@Component({
  selector: 'app-withdrawal-details-dialog',
  standalone: true,
  providers: [FinancialService],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatExpansionModule
  ],
  templateUrl: './withdrawal-details-dialog.component.html',
  styleUrls: ['./withdrawal-details-dialog.component.scss']
})
export class WithdrawalDetailsDialogComponent implements OnInit {
  // Signals for reactive state
  private withdrawalSignal = signal<WithdrawalRequest | null>(null);
  readonly isLoading = signal(true);

  // Computed values
  readonly withdrawal = this.withdrawalSignal.asReadonly();
  
  readonly reference = computed(() => this.withdrawal()?.reference || '');
  readonly providerReference = computed(() => {
    const w = this.withdrawal();
    return w?.providerReference || w?.meta?.processPayment?.providerReference || '';
  });
  
  readonly feeAmount = computed(() => {
    const w = this.withdrawal();
    return (w?.amount || 0) - (w?.amountPayable || 0);
  });
  
  readonly netAmount = computed(() => {
    const w = this.withdrawal();
    return w?.amountPayable || w?.amount || 0;
  });

  readonly statusClass = computed(() => {
    const status = this.withdrawal()?.status;
    return this.statusConfig[status || '']?.class || '';
  });

  readonly statusIcon = computed(() => {
    const status = this.withdrawal()?.status;
    return this.statusConfig[status || '']?.icon || 'help';
  });

  readonly statusLabel = computed(() => {
    const status = this.withdrawal()?.status;
    return this.statusConfig[status || '']?.label || status || 'Unknown';
  });

  private readonly statusConfig: Record<string, { class: string; icon: string; label: string }> = {
    'pending_approval': { class: 'status-pending_approval', icon: 'hourglass_empty', label: 'Pending Approval' },
    'processing': { class: 'status-processing', icon: 'pending', label: 'Processing' },
    'successful': { class: 'status-successful', icon: 'check_circle', label: 'Completed' },
    'failed': { class: 'status-failed', icon: 'error', label: 'Failed' },
    'reversed': { class: 'status-reversed', icon: 'swap_horiz', label: 'Reversed' }
  };

  constructor(
    public dialogRef: MatDialogRef<WithdrawalDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WithdrawalDetailsData,
    private financialService: FinancialService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadWithdrawalDetails();
  }

  loadWithdrawalDetails(): void {
    this.isLoading.set(true);
    
    this.financialService.getWithdrawalById(this.data.withdrawalId).subscribe({
      next: (withdrawal) => {
        console.log('Withdrawal details loaded:', withdrawal);
        this.withdrawalSignal.set(withdrawal);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading withdrawal details:', error);
        this.isLoading.set(false);
        this.snackBar.open('Error loading withdrawal details', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  refreshStatus(): void {
    this.snackBar.open('Checking latest status...', '', { duration: 2000 });
    this.loadWithdrawalDetails();
  }

  onApprove(): void {
    const w = this.withdrawal();
    if (!w) return;
    
    this.financialService.approveWithdrawal(w.withdrawalId).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('✅ Withdrawal approved successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close({ updated: true });
        }
      },
      error: (error) => {
        console.error('Error approving withdrawal:', error);
        this.snackBar.open('❌ Error approving withdrawal', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onReject(): void {
    const w = this.withdrawal();
    if (!w) return;
    
    this.financialService.rejectWithdrawal(w.withdrawalId, 'Rejected by admin').subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('✅ Withdrawal rejected successfully', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.dialogRef.close({ updated: true });
        }
      },
      error: (error) => {
        console.error('Error rejecting withdrawal:', error);
        this.snackBar.open('❌ Error rejecting withdrawal', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onRetry(): void {
    const w = this.withdrawal();
    if (!w) return;
    
    this.financialService.retryWithdrawal(w.withdrawalId).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('🔄 Withdrawal retry initiated', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadWithdrawalDetails();
        }
      },
      error: (error) => {
        console.error('Error retrying withdrawal:', error);
        this.snackBar.open('❌ Error retrying withdrawal', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}