import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ContactService } from '../../contact.service';

export interface BulkSmsDialogData { customerIds: string[]; count: number; preview?: Array<{ name: string; phone: string }>; }

const COST_PER_SMS = 10;

@Component({
  selector: 'app-bulk-sms-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './bulk-sms-dialog.component.html',
  styleUrls: ['./bulk-sms-dialog.component.scss'],
})
export class BulkSmsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<BulkSmsDialogComponent>);
  private readonly contactService = inject(ContactService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<BulkSmsDialogData>(MAT_DIALOG_DATA);

  readonly message = signal('');
  readonly sending = signal(false);
  readonly COST_PER_SMS = COST_PER_SMS;
  readonly smsCount = computed(() => Math.ceil(this.message().length / 160) || 1);
  readonly totalCost = computed(() => this.smsCount() * COST_PER_SMS * this.data.count);

  send(): void {
    if (!this.message().trim() || this.sending()) return;
    this.sending.set(true);
    this.contactService.sendBulkCustomerSms(this.data.customerIds, this.message().trim()).subscribe({
      next: (r) => { this.snackBar.open(r.message || 'Bulk SMS sent!', 'OK', { duration: 3000 }); this.dialogRef.close(true); },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to send bulk SMS.';
        this.snackBar.open(msg, 'OK', { duration: 6000 });
        if (err?.status === 402) this.dialogRef.close(false);
        else this.sending.set(false);
      },
    });
  }

  close(): void { this.dialogRef.close(); }
}
