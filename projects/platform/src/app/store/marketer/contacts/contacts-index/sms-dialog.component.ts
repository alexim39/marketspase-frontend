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
import { ContactService } from '../contact.service';

export interface SmsDialogData { customerId: string; customerName: string; phone: string; }

const COST_PER_SMS = 10;

@Component({
  selector: 'app-sms-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div class="sms-dialog">
      <h2 mat-dialog-title>Send SMS</h2>
      <mat-dialog-content>
        <div class="recipient-info"><strong>{{ data.customerName }}</strong><span>{{ data.phone }}</span></div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Message</mat-label>
          <textarea matInput rows="4" [ngModel]="message()" (ngModelChange)="message.set($event)" maxlength="480" placeholder="Type your SMS message..."></textarea>
          <mat-hint align="end">{{ message().length }}/480 · {{ smsCount() }} page(s) · ₦{{ totalCost() }}</mat-hint>
        </mat-form-field>
        <p class="cost-note">Cost: ₦{{ COST_PER_SMS }} per 160-character page. Total: ₦{{ totalCost() }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button [disabled]="sending()" (click)="close()">Cancel</button>
        <button mat-flat-button color="primary" [disabled]="sending() || !message().trim()" (click)="send()">
          @if (sending()) { <mat-spinner diameter="18"></mat-spinner> } @else { Send SMS (₦{{ totalCost() }}) }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`.sms-dialog { min-width: 400px; max-width: 500px; } .recipient-info { margin-bottom: 16px; } .recipient-info strong { display: block; } .recipient-info span { color: #888; font-size: 13px; } .full-width { width: 100%; } .cost-note { font-size: 12px; color: #888; margin-top: -8px; }`]
})
export class SmsDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SmsDialogComponent>);
  private readonly contactService = inject(ContactService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<SmsDialogData>(MAT_DIALOG_DATA);

  readonly message = signal('');
  readonly sending = signal(false);
  readonly COST_PER_SMS = COST_PER_SMS;
  readonly smsCount = computed(() => Math.ceil(this.message().length / 160) || 1);
  readonly totalCost = computed(() => this.smsCount() * COST_PER_SMS);

  send(): void {
    if (!this.message().trim() || this.sending()) return;
    this.sending.set(true);
    this.contactService.sendCustomerSms(this.data.customerId, this.message().trim()).subscribe({
      next: (r) => { this.snackBar.open(r.message || 'SMS sent!', 'OK', { duration: 3000 }); this.dialogRef.close(true); },
      error: (err) => {
        const msg = err?.error?.message || 'Failed to send SMS.';
        this.snackBar.open(msg, 'OK', { duration: 6000 });
        if (err?.status === 402) this.dialogRef.close(false);
        else this.sending.set(false);
      },
    });
  }

  close(): void { this.dialogRef.close(); }
}
