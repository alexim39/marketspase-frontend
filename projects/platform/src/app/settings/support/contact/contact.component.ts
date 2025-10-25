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
    template: `
      <div class="contact-container">
        <!-- Header Section -->
        <div class="contact-header">
          <div class="header-content">
            <div  class="header-icon">
              <mat-icon>support_agent</mat-icon>
            </div>            
            <h1 class="header-title">Get In Touch</h1>
            <p class="header-subtitle">
              We're here to help you grow your WhatsApp promotion business. 
              Send us a message and we'll respond within 24 hours.
            </p>

            <!-- Live Chat WhatsApp button (added) -->
            <div class="header-actions">
              <button mat-stroked-button color="primary" class="whatsapp-btn" (click)="startLiveChat()" matTooltip="Start WhatsApp live chat">
                <mat-icon class="whatsapp-icon">chat</mat-icon>
                <span class="btn-text">Live Chat</span>
              </button>
            </div>

          </div>
        </div>

        <!-- Contact Form Card -->
        <mat-card class="contact-card">
          <mat-card-header class="card-header">
            <mat-card-title class="card-title">
              <mat-icon>mail_outline</mat-icon>
              Contact Form
            </mat-card-title>
            <mat-card-subtitle class="card-subtitle">
              Fill out the form below and we'll get back to you soon
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="card-content">
            <form [formGroup]="contactForm()" (ngSubmit)="onSubmit()" class="contact-form">
              
              <!-- Reason Selection -->
              <div class="form-section">
                <mat-form-field appearance="outline" class="full-width">
                <mat-label>
                    <mat-icon matPrefix>category</mat-icon>
                    Reason for Contact
                </mat-label>
                <mat-select formControlName="reason" [placeholder]="'Select a reason'">
                    <!-- Trigger: What shows when an option is selected -->
                    <mat-select-trigger>
                        @let selected = getSelectedReason();
                        @if (selected) {
                            <mat-icon class="reason-icon">{{ selected.icon }}</mat-icon>
                            {{ selected.label }}
                        } @else {
                            <span>Select a reason</span>
                        }
                    </mat-select-trigger>
                    <mat-option value="" disabled>Choose your reason</mat-option>
                    @for (reason of contactReasons(); track reason) {
                    <mat-option [value]="reason.value" class="reason-option">
                        <div class="reason-content">
                            <mat-icon class="reason-icon">{{ reason.icon }}</mat-icon>
                            <div class="reason-text">
                                <span class="reason-label">{{ reason.label }}</span>
                                @if (reason.description) {
                                <span class="reason-desc">{{ reason.description }}</span>
                                }
                            </div>
                        </div>
                    </mat-option>
                    }
                </mat-select>
                @if (contactForm().get('reason')?.hasError('required') && contactForm().get('reason')?.touched) {
                    <mat-error>
                    <mat-icon>error_outline</mat-icon>
                    Please select a reason for your contact
                    </mat-error>
                }
                </mat-form-field>
              </div>
              <!-- Subject Field -->
              <div class="form-section">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>
                    <mat-icon matPrefix>subject</mat-icon>
                    Message Subject
                  </mat-label>
                  <input 
                    matInput 
                    formControlName="subject" 
                    placeholder="Brief summary of your message"
                    maxlength="100"
                  >
                  <mat-hint align="end">{{ contactForm().get('subject')?.value?.length || 0 }} / 100</mat-hint>
                  @if (contactForm().get('subject')?.hasError('required') && contactForm().get('subject')?.touched) {
                    <mat-error>
                        <mat-icon>error_outline</mat-icon>
                        Subject is required
                    </mat-error>
                  }
                  @if (contactForm().get('subject')?.hasError('minlength') && contactForm().get('subject')?.touched) {
                    <mat-error>
                        <mat-icon>error_outline</mat-icon>
                        Subject must be at least 5 characters long
                    </mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Message Field -->
              <div class="form-section">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>
                    <mat-icon matPrefix>message</mat-icon>
                    Your Message
                  </mat-label>
                  <textarea 
                    matInput 
                    formControlName="message" 
                    placeholder="Please provide detailed information about your inquiry..."
                    rows="6"
                    maxlength="1000"
                  ></textarea>
                  <mat-hint align="end">{{ contactForm().get('message')?.value?.length || 0 }} / 1000</mat-hint>
                  @if (contactForm().get('message')?.hasError('required') && contactForm().get('message')?.touched) {
                    <mat-error>
                        <mat-icon>error_outline</mat-icon>
                        Message is required
                    </mat-error>
                  }
                  @if (contactForm().get('message')?.hasError('minlength') && contactForm().get('message')?.touched) {
                    <mat-error>
                        <mat-icon>error_outline</mat-icon>
                        Message must be at least 10 characters long
                    </mat-error>
                  }
                </mat-form-field>
              </div>

              <!-- Loading Progress -->
               @if (isSpinning()) {
              <mat-progress-bar mode="indeterminate" class="progress-bar"/>
               }

              <!-- Submit Button -->
              <div class="form-actions">
                <button 
                  mat-flat-button 
                  color="primary" 
                  type="submit"
                  [disabled]="isSpinning() || !contactForm().valid"
                  class="submit-btn"
                  matTooltip="Send your message to our support team"
                >
                @if (!isSpinning()) {
                    <mat-icon>send</mat-icon>
                } @else {
                    <mat-icon class="spinning">refresh</mat-icon>
                }                  
                  {{ isSpinning() ? 'Sending...' : 'Send Message' }}
                </button>

                <button 
                  mat-stroked-button 
                  type="button" 
                  (click)="resetForm()"
                  [disabled]="isSpinning()"
                  class="reset-btn"
                  matTooltip="Clear all form fields"
                >
                  <mat-icon>clear</mat-icon>
                  Clear Form
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Contact Info Section -->
        <div class="contact-info">
          <div class="info-grid">
            <div class="info-item">
              <mat-icon class="info-icon">schedule</mat-icon>
              <div class="info-content">
                <h3>Response Time</h3>
                <p>Within 24 hours</p>
              </div>
            </div>
            <div class="info-item">
              <mat-icon class="info-icon">support</mat-icon>
              <div class="info-content">
                <h3>Support Hours</h3>
                <p>24/7 Available</p>
              </div>
            </div>
            <div class="info-item">
              <mat-icon class="info-icon">verified</mat-icon>
              <div class="info-content">
                <h3>Trusted Platform</h3>
                <p>Secure & Reliable</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
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
      userId: [this.user()?._id || '']
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
}