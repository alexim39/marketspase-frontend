import { Component, inject, signal, computed, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { StoreCustomerService } from '../../services/store-customer.service';
import { UserService } from '../../../common/services/user.service';

export interface BulkSmsDialogData {
  emails: string[];
  count: number;
  preview: Array<{ name: string; phone: string }>;
  marketerId?: string;
}

@Component({
  selector: 'app-support-bulk-sms-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="bulk-sms-dialog">
      <div class="sms-header">
        <h2 mat-dialog-title>Bulk SMS</h2>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>

      <mat-dialog-content>
        <div class="bulk-recipients">
          <mat-icon>groups</mat-icon>
          <div>
            <strong>{{ data.count }} recipient{{ data.count !== 1 ? 's' : '' }}</strong>
            <span>{{ data.preview.slice(0, 3).map(p => p.name).join(', ') }}{{ data.count > 3 ? '...' : '' }}</span>
          </div>
        </div>

        @if (sending()) {
          <div class="sending-bar"><mat-spinner diameter="20"></mat-spinner><span>Sending to {{ data.count }} recipients...</span></div>
        }

        <div class="sms-composer">
          <textarea [(ngModel)]="message" maxlength="480" rows="5"
            placeholder="Type your SMS message for all recipients..."></textarea>
          <div class="sms-meta">
            <span>{{ message.length }} / 480 chars</span>
            <span>{{ pageCount() }} page{{ pageCount() !== 1 ? 's' : '' }}</span>
            <span class="cost">₦{{ totalCost() }}</span>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close [disabled]="sending()">Cancel</button>
        <button mat-flat-button color="primary" (click)="send()" [disabled]="!message.trim() || sending()">
          <mat-icon>send</mat-icon> Send to {{ data.count }} recipient{{ data.count !== 1 ? 's' : '' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .bulk-sms-dialog { min-width: 380px; max-width: 500px; }
    .sms-header { display: flex; justify-content: space-between; align-items: center; padding: 0 24px; h2 { margin: 0; font-size: 1.1rem; } }
    .bulk-recipients { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.8rem; background: rgba(var(--primary-rgb), 0.05); border-radius: 10px; margin-bottom: 1rem;
      strong { font-size: 0.88rem; display: block; }
      span { font-size: 0.72rem; color: var(--text-secondary); display: block; margin-top: 0.1rem; }
      mat-icon { font-size: 1.8rem; width: 1.8rem; height: 1.8rem; color: var(--text-tertiary); }
    }
    .sending-bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; color: var(--text-secondary); font-size: 0.85rem; }
    .sms-composer { textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 10px; font-family: inherit; font-size: 0.88rem; resize: vertical; box-sizing: border-box; background: var(--background-color); color: var(--text-primary); &:focus { outline: none; border-color: var(--primary-color); } } }
    .sms-meta { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-tertiary); margin-top: 0.5rem; .cost { font-weight: 700; color: var(--primary-color); } }
  `]
})
export class SupportBulkSmsDialogComponent {
  private dialogRef = inject(MatDialogRef<SupportBulkSmsDialogComponent>);
  private customerService = inject(StoreCustomerService);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);

  sending = signal(false);
  message = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: BulkSmsDialogData) {}

  pageCount = () => Math.max(1, Math.ceil(this.message.length / 160));
  totalCost = () => this.pageCount() * 10 * this.data.count;

  send(): void {
    if (!this.message.trim() || this.sending()) return;
    this.sending.set(true);
    const marketerId = this.userService.user()?._id || '';
    this.customerService.sendBulkCustomerSms(marketerId, {
      emails: this.data.emails, message: this.message.trim(),
    }).subscribe({
      next: () => {
        this.snackBar.open(`SMS sent to ${this.data.count} recipients!`, 'OK', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.sending.set(false);
        const msg = err?.error?.message || 'Failed to send bulk SMS.';
        this.snackBar.open(msg, 'OK', { duration: 5000 });
        if (err?.status === 402) this.dialogRef.close(false);
      },
    });
  }
}
