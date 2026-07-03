import { Component, inject, signal, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ApiService } from '@shared/services/api';
import { Service } from '../../../store/models';

export interface ServiceInquiryDialogData {
  service: Service;
  store: any;
}

@Component({
  selector: 'app-service-inquiry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="inquiry-dialog">
      <div class="inquiry-header">
        <h2 mat-dialog-title>Inquire About Service</h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        @if (submitting()) {
          <div class="submitting-overlay">
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
            <p>Sending your inquiry...</p>
          </div>
        }

        <div class="service-summary">
          <div class="service-name">{{ data.service.name }}</div>
          @if (data.service.price) {
            <div class="service-price">₦{{ data.service.price | number:'1.0-0' }}</div>
          }
          @if (data.service.pricingType === 'quote') {
            <div class="service-price quote">Custom Quote</div>
          }
        </div>

        <form [formGroup]="inquiryForm" (ngSubmit)="submit()" class="inquiry-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your Name</mat-label>
            <input matInput formControlName="name" placeholder="John Doe" required>
            <mat-error *ngIf="name?.invalid && name?.touched">Name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Phone Number</mat-label>
            <input matInput formControlName="phone" placeholder="08012345678" required>
            <mat-error *ngIf="phone?.invalid && phone?.touched">Valid phone number is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" placeholder="you@example.com" type="email">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Message</mat-label>
            <textarea matInput formControlName="message" rows="4" placeholder="Describe what you need..." maxlength="1000"></textarea>
            <mat-hint align="end">{{ (message?.value?.length || 0) }}/1000</mat-hint>
          </mat-form-field>

          <div class="inline-fields">
            <mat-form-field appearance="outline">
              <mat-label>Budget (₦)</mat-label>
              <input matInput formControlName="budget" placeholder="e.g., 50000">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Timeline</mat-label>
              <input matInput formControlName="timeline" placeholder="e.g., 1 week">
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close [disabled]="submitting()">Cancel</button>
        <button mat-raised-button color="primary" (click)="submit()" [disabled]="inquiryForm.invalid || submitting()">
          {{ submitting() ? 'Sending...' : 'Submit Inquiry' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .inquiry-dialog {
      .inquiry-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px 0;

        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .close-btn { margin-right: -8px; }
      }

      .submitting-overlay {
        text-align: center;
        padding: 16px 0;
        p {
          margin: 8px 0 0;
          color: var(--text-secondary);
          font-size: 14px;
        }
      }

      .service-summary {
        background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;

        .service-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .service-price {
          font-size: 20px;
          font-weight: 700;
          color: var(--primary-color);
          margin-top: 4px;

          &.quote {
            font-style: italic;
            font-weight: 500;
          }
        }
      }

      .inquiry-form {
        .full-width { width: 100%; margin-bottom: 4px; }

        .inline-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;

          @media (max-width: 480px) {
            grid-template-columns: 1fr;
          }
        }
      }
    }
  `]
})
export class ServiceInquiryDialogComponent {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ServiceInquiryDialogComponent>);
  private route = inject(ActivatedRoute, { optional: true });

  submitting = signal(false);

  inquiryForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^(\+234|0)?[789][01]\d{8}$/)]],
    email: ['', Validators.email],
    message: ['', Validators.maxLength(1000)],
    budget: [''],
    timeline: [''],
  });

  get name() { return this.inquiryForm.get('name'); }
  get phone() { return this.inquiryForm.get('phone'); }
  get message() { return this.inquiryForm.get('message'); }

  constructor(@Inject(MAT_DIALOG_DATA) public data: ServiceInquiryDialogData) {}

  submit(): void {
    this.inquiryForm.markAllAsTouched();
    if (this.inquiryForm.invalid || this.submitting()) return;

    this.submitting.set(true);

    const trackingCode = this.route?.snapshot.queryParamMap.get('trackingCode') || null;
    const formValue = this.inquiryForm.value;

    const payload = {
      serviceId: this.data.service._id,
      customer: {
        name: formValue.name.trim(),
        phone: formValue.phone.trim(),
        email: formValue.email?.trim() || undefined,
      },
      message: formValue.message?.trim() || undefined,
      budget: formValue.budget?.trim() || undefined,
      timeline: formValue.timeline?.trim() || undefined,
      ...(trackingCode ? { trackingCode } : {}),
    };

    this.apiService.post('api/v1/stores/service/inquiry', payload, undefined, true).subscribe({
      next: () => {
        this.submitting.set(false);
        this.dialogRef.close({ submitted: true });
      },
      error: (error) => {
        this.submitting.set(false);
        this.snackBar.open(error.error?.message || 'Failed to send inquiry', 'OK', { duration: 5000 });
      },
    });
  }
}
