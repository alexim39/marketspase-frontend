import { CommonModule } from '@angular/common';
import { 
  Component, 
  Inject, 
  inject, 
  signal,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { 
  MAT_DIALOG_DATA, 
  MatDialog, 
  MatDialogActions, 
  MatDialogContent, 
  MatDialogModule, 
  MatDialogRef 
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WithdrawalService, SavedAccountInterface } from '../withdrawal.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

interface SavedAccountsDialogData {
  savedAccounts: SavedAccountInterface[];
  userId: string;
}

interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

/**
 * Confirmation dialog component for delete actions
 */
@Component({
  selector: 'async-confirmation-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">{{ data.cancelText }}</button>
      <button mat-button color="warn" [mat-dialog-close]="true" cdkFocusInitial>
        {{ data.confirmText }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  providers: [WithdrawalService],
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatDialogContent, 
    MatDialogActions
  ]
})
export class ConfirmationDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {}
}

/**
 * Dialog component for displaying and managing saved payment accounts.
 * Provides functionality to view and remove saved accounts.
 */
@Component({
  selector: 'async-saved-accounts-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatListModule, 
    MatIconModule, 
    MatDialogContent, 
    MatDialogActions,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  providers: [WithdrawalService],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>
        <mat-icon class="dialog-icon">account_balance_wallet</mat-icon>
        Saved Accounts
      </h2>
      <button 
        mat-icon-button 
        (click)="close()" 
        matTooltip="Close dialog"
        class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="saved-accounts-container">
      <div *ngIf="isLoading()" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Loading saved accounts...</p>
      </div>

      <section 
        *ngIf="!isLoading() && savedAccounts().length > 0" 
        class="accounts-list">
        <div class="accounts-header">
          <h3>Your Saved Accounts ({{ savedAccounts().length }})</h3>
          <p class="accounts-description">
            Manage your saved bank accounts for quick withdrawals
          </p>
        </div>

        <article 
          *ngFor="let account of savedAccounts(); trackBy: trackByAccountId" 
          class="saved-account-item"
          [class.removing]="removingAccountIds().includes(account.accountNumber)">
          
          <div class="account-icon">
            <mat-icon>account_balance</mat-icon>
          </div>
          
          <div class="account-details">
            <div class="bank-name">{{ account.bank }}</div>
            <div class="account-info">
              <span class="account-number">{{ formatAccountNumber(account.accountNumber) }}</span>
              <span class="separator">•</span>
              <span class="account-name">{{ account.accountName }}</span>
            </div>
          </div>
          
          <div class="account-actions">
            <button 
              mat-icon-button 
              color="warn" 
              (click)="confirmRemoveAccount(account)" 
              [disabled]="removingAccountIds().includes(account.accountNumber)"
              [matTooltip]="removingAccountIds().includes(account.accountNumber) ? 'Removing...' : 'Remove Account'"
              class="remove-button">
              <mat-spinner 
                *ngIf="removingAccountIds().includes(account.accountNumber)" 
                diameter="20">
              </mat-spinner>
              <mat-icon *ngIf="!removingAccountIds().includes(account.accountNumber)">delete</mat-icon>
            </button>
          </div>
        </article>
      </section>

      <div 
        *ngIf="!isLoading() && savedAccounts().length === 0" 
        class="no-accounts-container">
        <mat-icon class="no-accounts-icon">account_balance_wallet</mat-icon>
        <h3>No Saved Accounts</h3>
        <p class="no-accounts-message">
          You haven't saved any bank accounts yet. 
          Save an account during withdrawal for quick future transactions.
        </p>
        <button mat-raised-button color="primary" (click)="close()">
          <mat-icon>add</mat-icon>
          Make a Withdrawal
        </button>
      </div>

      <div *ngIf="error()" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h3>Error Loading Accounts</h3>
        <p>{{ error() }}</p>
        <button mat-raised-button color="primary" (click)="refreshAccounts()">
          <mat-icon>refresh</mat-icon>
          Try Again
        </button>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <div class="action-info">
        <mat-icon class="info-icon">info</mat-icon>
        <span>Saved accounts are encrypted and secure</span>
      </div>
      <button mat-button color="primary" (click)="close()">
        <mat-icon>check</mat-icon>
        Done
      </button>
    </mat-dialog-actions>
  `,
  styleUrls: ['./saved-account.component.scss'],
})
export class SavedAccountsComponent {
  // Injected dependencies
  private readonly dialogRef = inject(MatDialogRef<SavedAccountsComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly withdrawalService = inject(WithdrawalService);
  private readonly destroyRef = inject(DestroyRef);

  // Signals for reactive state management
  readonly savedAccounts = signal<SavedAccountInterface[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly removingAccountIds = signal<string[]>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SavedAccountsDialogData
  ) {
    this.initializeComponent();
  }

  private initializeComponent(): void {
    this.validateDialogData();
    this.loadSavedAccounts();
  }

  private validateDialogData(): void {
    if (!this.data?.userId) {
      console.error('SavedAccountsComponent: userId is required');
      this.error.set('Invalid dialog data. Please try again.');
      return;
    }
  }

  private loadSavedAccounts(): void {
    //console.log(this.data)
    if (this.data?.savedAccounts && Array.isArray(this.data.savedAccounts)) {
      // Use provided data first
      this.savedAccounts.set(this.data.savedAccounts);
    } else {
      // Fetch from service if not provided
      this.refreshAccounts();
    }
  }

  refreshAccounts(): void {
    if (!this.data?.userId) return;

    this.isLoading.set(true);
    this.error.set(null);

    /* this.paymentService.getSavedAccounts(this.data.userId)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error loading saved accounts:', error);
          const errorMessage = error.error?.message || 'Failed to load saved accounts. Please try again.';
          this.error.set(errorMessage);
          return of([]);
        }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (accounts: SavedAccountInterface[]) => {
          this.savedAccounts.set(accounts || []);
        }
      }); */

  }

  async confirmRemoveAccount(account: SavedAccountInterface): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Remove Saved Account',
        message: `Are you sure you want to remove ${account.bank} account ${this.formatAccountNumber(account.accountNumber)}? This action cannot be undone.`,
        confirmText: 'Yes, Remove',
        cancelText: 'Cancel'
      },
      width: '400px',
      disableClose: true
    });

    const confirmed = await dialogRef.afterClosed().toPromise();
    
    if (confirmed) {
      this.removeAccount(account);
    }
  }

  private removeAccount(account: SavedAccountInterface): void {
    if (!this.data?.userId) {
      this.showErrorMessage('Invalid user data. Please try again.');
      return;
    }

    // Add account ID to removing list
    this.removingAccountIds.update(ids => [...ids, account.accountNumber]);

    this.withdrawalService.removeSavedAccount(account.accountNumber, this.data.userId)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error removing account:', error);
          const errorMessage = error.error?.message || 'Failed to remove account. Please try again.';
          this.showErrorMessage(errorMessage);
          return EMPTY;
        }),
        finalize(() => {
          // Remove account ID from removing list
          this.removingAccountIds.update(ids => 
            ids.filter(accountNumber => accountNumber !== account.accountNumber)
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response: any) => {
          this.showSuccessMessage(response.message || 'Account removed successfully');
          this.removeAccountFromList(account.accountNumber);
        }
      });
  }

  private removeAccountFromList(accountNumber: string): void {
    this.savedAccounts.update(accounts => 
      accounts.filter(account => account.accountNumber !== accountNumber)
    );
    
    // Also update the dialog data if it exists
    if (this.data?.savedAccounts) {
      const index = this.data.savedAccounts.findIndex(account => account.accountNumber === accountNumber);
      if (index !== -1) {
        this.data.savedAccounts.splice(index, 1);
      }
    }
  }

  formatAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length !== 10) {
      return accountNumber;
    }
    // Format as: 0123-456-789
    return `${accountNumber.slice(0, 4)}-${accountNumber.slice(4, 7)}-${accountNumber.slice(7)}`;
  }

  trackByAccountId(index: number, account: SavedAccountInterface): string {
    return account.accountNumber;
  }

  close(): void {
    this.dialogRef.close();
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'OK', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', { 
      duration: 4000,
      panelClass: ['success-snackbar']
    });
  }
}