import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, Input, signal, computed, OnInit, OnDestroy, Signal, effect, DestroyRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SupportService } from '../support.service';
import { UserInterface } from '../../../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ContactReason {
  value: string;
  label: string;
  icon: string;
  description?: string;
}

@Component({
    selector: 'async-contact',
    standalone: true,
    providers: [SupportService],
    imports: [
        MatButtonModule,
        MatDividerModule,
        MatProgressBarModule,
        MatCardModule,
        MatTooltipModule,
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatIconModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSelectModule
    ],
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, OnDestroy {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  
  // Modern Angular signals
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly supportService = inject(SupportService);

  // Form signal
  contactForm = signal<FormGroup>(this.fb.group({}));
  isSpinning = signal(false);

  // Contact reasons configuration
  contactReasons = signal<ContactReason[]>([
    { value: 'promotion', label: 'Promotion Services', icon: 'campaign', description: 'Questions about promoting posts' },
    { value: 'earnings', label: 'Earnings & Payments', icon: 'monetization_on', description: 'Payment and earning inquiries' },
    { value: 'technical', label: 'Technical Support', icon: 'build', description: 'App issues and bugs' },
    { value: 'account', label: 'Account Issues', icon: 'account_circle', description: 'Profile and account problems' },
    { value: 'partnership', label: 'Business Partnership', icon: 'handshake', description: 'Collaboration opportunities' },
    { value: 'feedback', label: 'Feedback & Suggestions', icon: 'feedback', description: 'Share your thoughts' },
    { value: 'billing', label: 'Billing & Refunds', icon: 'receipt', description: 'Payment and billing support' },
    { value: 'general', label: 'General Inquiry', icon: 'help_outline', description: 'General questions' },
    { value: 'legal', label: 'Legal & Compliance', icon: 'gavel', description: 'Legal matters and compliance' },
    { value: 'other', label: 'Other', icon: 'more_horiz', description: 'Something else' }
  ]);

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnDestroy(): void {
    // this.destroy$.next();
    // this.destroy$.complete();
  }

  getSelectedReason() {
    const value = this.contactForm().get('reason')?.value;
    return this.contactReasons().find(r => r.value === value) ?? null;
  }


  private initializeForm(): void {
    const form = this.fb.group({
      reason: ['', [Validators.required]],
      subject: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      userId: [this.user()?._id || ''],
      userEmail: [this.user()?.email || '']
    });

    this.contactForm.set(form);
  }

  /**
   * Submits the contact form with modern RxJS patterns
   */
  onSubmit(): void {
    if (!this.contactForm().valid) {
      this.markAllAsTouched();
      this.showValidationError();
      return;
    }

    this.isSpinning.set(true);
    const formData = this.contactForm().value;

    this.supportService.submit(formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.isSpinning.set(false);
          this.showSuccessMessage(response.message || 'Message sent successfully!');
          this.resetForm();
          this.scrollToTop();
        },
        error: (error: HttpErrorResponse) => {
          this.isSpinning.set(false);
          this.handleError(error);
        }
      });
  }

  /**
   * Resets the form to initial state
   */
  resetForm(): void {
    this.contactForm().reset();
    Object.keys(this.contactForm().controls).forEach(key => {
      this.contactForm().get(key)?.setErrors(null);
      this.contactForm().get(key)?.markAsUntouched();
    });
  }

  /**
   * Marks all form controls as touched to show validation errors
   */
  private markAllAsTouched(): void {
    Object.keys(this.contactForm().controls).forEach(controlName => {
      this.contactForm().get(controlName)?.markAsTouched();
    });
  }

  /**
   * Shows success message with custom styling
   */
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, '✓', {
      duration: 4000,
    });
  }

  /**
   * Shows validation error message
   */
  private showValidationError(): void {
    this.snackBar.open('Please fill in all required fields correctly', '⚠', {
      duration: 3000,
    });
  }

  /**
   * Handles HTTP errors with detailed messaging
   */
  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    
    if (error.status === 0) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.status >= 400 && error.status < 500) {
      errorMessage = error.error?.message || 'Invalid request. Please check your input.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    this.snackBar.open(errorMessage, '✗', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
    });
  }

  /**
   * Smooth scroll to top of page
   */
  private scrollToTop(): void {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  }

   // add startLiveChat method
  startLiveChat(): void {
    const whatsappUrl = 'https://wa.me/2349062537816';
    // provide immediate UI feedback
    this.snackBar.open('Opening WhatsApp live chat...', 'Close', { duration: 2500 });
    // open in new tab / window
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  openWhatsAppChannel() {
     const whatsappUrl = 'https://whatsapp.com/channel/0029Vb77xA51NCrKysUMO11D';
    // provide immediate UI feedback
    this.snackBar.open('Opening WhatsApp channel...', 'Close', { duration: 2500 });
    // open in new tab / window
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}