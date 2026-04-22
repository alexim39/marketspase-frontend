// transfer-details-dialog.component.ts
import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TransferService, TransferTransaction } from '../transfer.service';

@Component({
  selector: 'app-transfer-details-dialog',
  templateUrl: './transfer-details-dialog.component.html',
  styleUrls: ['./transfer-details-dialog.component.scss'],
  standalone: true,
  providers: [TransferService],
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ]
})
export class TransferDetailsDialogComponent implements OnInit {
  readonly isLoading = signal(true);
  readonly transfer = signal<TransferTransaction | null>(null);
  readonly error = signal<string | null>(null);

  constructor(
    private readonly dialogRef: MatDialogRef<TransferDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { transferId: string },
    private readonly transferService: TransferService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadTransferDetails();
  }

  loadTransferDetails() {
    this.isLoading.set(true);
    this.error.set(null);

    this.transferService.getTransferById(this.data.transferId).subscribe({
      next: (transfer) => {
        this.transfer.set(transfer);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading transfer details:', error);
        this.error.set('Failed to load transfer details');
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'completed': 'status-success',
      'pending': 'status-pending',
      'failed': 'status-failed',
      'reversed': 'status-reversed'
    };
    return classes[status] || 'status-default';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'completed': 'check_circle',
      'pending': 'hourglass_empty',
      'failed': 'error',
      'reversed': 'settings_backup_restore'
    };
    return icons[status] || 'help';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed',
      'reversed': 'Reversed'
    };
    return labels[status] || status;
  }

  getTransferTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'self': 'Self Transfer',
      'other': 'Transfer to Other User'
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

  getTransferTypeDescription(transfer: TransferTransaction): string {
    if (transfer.transferType === 'self') {
      return `Transfer from Promoter wallet to own Marketer wallet`;
    } else {
      return `Transfer from ${transfer.sourceUserName} to ${transfer.destinationUserName}`;
    }
  }

  copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(`${label} copied to clipboard`, 'Close', {
        duration: 2000,
        panelClass: ['success-snackbar']
      });
    }).catch(() => {
      this.snackBar.open('Failed to copy to clipboard', 'Close', {
        duration: 2000,
        panelClass: ['error-snackbar']
      });
    });
  }

  close() {
    this.dialogRef.close();
  }
}