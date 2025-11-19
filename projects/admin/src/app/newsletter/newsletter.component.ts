import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoadingService } from '../../../../shared-services/src/public-api';
import { NewsletterService, NewsletterStats, CreateNewsletterRequest } from './newsletter.service';
import { AdminService } from '../common/services/user.service';

interface Newsletter {
  _id: string;
  subject: string;
  previewText: string;
  content: string;
  recipientType: 'all' | 'marketers' | 'promoters' | 'external';
  recipientCount: number;
  externalEmails?: string[];
  status: 'draft' | 'scheduled' | 'sent';
  sentDate: Date;
  openRate: number;
  clickRate: number;
}

interface Stats {
  total: number;
  draft: number;
  scheduled: number;
  sent: number;
}

// Email validation function
function emailValidator(control: AbstractControl) {
  if (!control.value) return null;
  
  const emails = control.value.split(/[\n,]/)
    .map((email: string) => email.trim())
    .filter((email: string) => email.length > 0);
  
  // Check if exceeds maximum
  if (emails.length > 1000) {
    return { maxEmails: true };
  }
  
  // Validate each email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
  
  if (invalidEmails.length > 0) {
    return { invalidEmails: true };
  }
  
  return null;
}

@Component({
  selector: 'app-newsletter-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterManagementComponent implements OnInit {
  readonly adminService = inject(AdminService);
 private fb = inject(FormBuilder);
  private newsletterService = inject(NewsletterService);
  private snackBar = inject(MatSnackBar);
  public loadingService = inject(LoadingService);

  // Constants
  readonly MAX_EXTERNAL_EMAILS = 1000;

  // Signals
  showForm = signal(false);
  editingId = signal<string | null>(null);
  searchQuery = signal('');
  filterStatus = signal('all');
  saving = signal(false);
  invalidEmails = signal<string[]>([]);
  recipientCounts = signal({ all: 0, marketers: 0, promoters: 0 });
  
  // Data
  newsletters = signal<Newsletter[]>([]);
  stats = signal<NewsletterStats>({
    total: 0,
    draft: 0,
    scheduled: 0,
    sent: 0,
    totalSent: 0,
    openRate: 0,
    clickRate: 0
  });

  // Form
  form: FormGroup;

  // Computed values
  filteredNewsletters = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const status = this.filterStatus();
    
    return this.newsletters().filter(newsletter => {
      const matchesSearch = newsletter.subject.toLowerCase().includes(query) ||
                           newsletter.previewText.toLowerCase().includes(query);
      const matchesStatus = status === 'all' || newsletter.status === status;
      
      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    this.form = this.createForm();
  }

  ngOnInit(): void {
     this.adminService.fetchAdmin();
    this.loadNewsletters();
    this.loadStats();
    this.loadRecipientCounts();
    
    this.form.get('scheduledDate')?.setValue(new Date());
    this.form.get('scheduledTime')?.setValue('09:00');
    
    this.form.get('recipientType')?.valueChanges.subscribe(() => {
      this.validateExternalEmails();
    });
  }

  private loadNewsletters(): void {
    this.loadingService.show();
    this.newsletterService.getNewsletters().subscribe({
      next: (response) => {
        if (response.success) {
          this.newsletters.set(response.data);
        }
        this.loadingService.hide();
      },
      error: (error) => {
        console.error('Error loading newsletters:', error);
        this.showError('Failed to load newsletters');
        this.loadingService.hide();
      }
    });
  }

  private loadStats(): void {
    this.newsletterService.getNewsletterStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  private loadRecipientCounts(): void {
    this.newsletterService.getRecipientCounts().subscribe({
      next: (response) => {
        if (response.success) {
          this.recipientCounts.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading recipient counts:', error);
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5)]],
      previewText: ['', [Validators.maxLength(150)]],
      content: ['', [Validators.required, Validators.minLength(10)]],
      recipientType: ['all', Validators.required],
      externalEmails: ['', [emailValidator]],
      sendOption: ['draft', Validators.required],
      scheduledDate: [new Date()],
      scheduledTime: ['09:00']
    });
  }

  // Email validation methods
  validateExternalEmails(): void {
    const emailsControl = this.form.get('externalEmails');
    if (!emailsControl?.value || this.form.get('recipientType')?.value !== 'external') {
      this.invalidEmails.set([]);
      return;
    }

    const emails = this.parseEmails(emailsControl.value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalid = emails.filter(email => !emailRegex.test(email));
    
    this.invalidEmails.set(invalid);
  }

  parseEmails(emailString: string): string[] {
    return emailString.split(/[\n,]/)
      .map(email => email.trim())
      .filter(email => email.length > 0);
  }

  getEmailCount(): number {
    if (this.form.get('recipientType')?.value !== 'external') return 0;
    const emailValue = this.form.get('externalEmails')?.value;
    return emailValue ? this.parseEmails(emailValue).length : 0;
  }

  getInvalidEmails(): string[] {
    return this.invalidEmails();
  }

 getRecipientCount(): number {
    const recipientType = this.form.get('recipientType')?.value;
    const counts = this.recipientCounts();
    
    switch (recipientType) {
      case 'all': return counts.all;
      case 'marketers': return counts.marketers;
      case 'promoters': return counts.promoters;
      case 'external': return this.getEmailCount();
      default: return 0;
    }
  }

// Updated saveNewsletter method
saveNewsletter(): void {
  if (this.form.invalid) return;
  if (this.form.get('recipientType')?.value === 'external' && this.getInvalidEmails().length > 0) {
    this.showError('Please fix invalid email addresses before sending');
    return;
  }

  this.saving.set(true);
  const formValue = this.form.value;
  const sendOption = formValue.sendOption;

  const newsletterData: CreateNewsletterRequest = {
    subject: formValue.subject,
    previewText: formValue.previewText,
    content: formValue.content,
    recipientType: formValue.recipientType,
    externalEmails: formValue.recipientType === 'external' ? this.parseEmails(formValue.externalEmails) : undefined,
    sendOption: sendOption,
    scheduledDate: sendOption === 'schedule' ? formValue.scheduledDate : undefined,
    scheduledTime: sendOption === 'schedule' ? formValue.scheduledTime : undefined,
    createdBy: this.adminService.adminData()?._id || '',
    title: `Newsletter - ${formValue.subject}` || `Newsletter ${new Date().toLocaleDateString()}`
  };

  // First, create/update the newsletter
  const saveOperation = this.editingId() 
    ? this.newsletterService.updateNewsletter(this.editingId()!, { ...newsletterData, id: this.editingId()! })
    : this.newsletterService.createNewsletter(newsletterData);

  saveOperation.subscribe({
    next: (response) => {
      if (response.success) {
        const newsletterId = response.data.id || response.data._id;
        
        // Handle different send options
        if (sendOption === 'now') {
          this.sendNewsletterImmediately(newsletterId);
        } else if (sendOption === 'schedule') {
          this.scheduleNewsletter(newsletterId, newsletterData.scheduledDate!);
        } else {
          // Draft - just show success and close
          this.handleSaveSuccess();
        }
      } else {
        this.saving.set(false);
        this.showError(response.message || 'Failed to save newsletter');
      }
    },
    error: (error) => {
      console.error('Error saving newsletter:', error);
      this.saving.set(false);
      this.showError('Failed to save newsletter');
    }
  });
}

// New method to send newsletter immediately
private sendNewsletterImmediately(newsletterId: string): void {
  this.newsletterService.sendNewsletter(newsletterId).subscribe({
    next: (response) => {
      this.saving.set(false);
      if (response.success) {
        this.handleSaveSuccess();
        this.showSuccess('Newsletter sent successfully!');
      } else {
        this.showError(response.message || 'Failed to send newsletter');
      }
    },
    error: (error) => {
      console.error('Error sending newsletter:', error);
      this.saving.set(false);
      this.showError('Failed to send newsletter');
    }
  });
}

// New method to schedule newsletter
private scheduleNewsletter(newsletterId: string, scheduledDate: Date): void {
  this.newsletterService.scheduleNewsletter(newsletterId, scheduledDate).subscribe({
    next: (response) => {
      this.saving.set(false);
      if (response.success) {
        this.handleSaveSuccess();
        this.showSuccess('Newsletter scheduled successfully!');
      } else {
        this.showError(response.message || 'Failed to schedule newsletter');
      }
    },
    error: (error) => {
      console.error('Error scheduling newsletter:', error);
      this.saving.set(false);
      this.showError('Failed to schedule newsletter');
    }
  });
}

// Common success handler
private handleSaveSuccess(): void {
  this.showForm.set(false);
  this.form.reset();
  this.loadNewsletters();
  this.loadStats();
}

  // Updated deleteNewsletter method
  deleteNewsletter(id: string): void {
    if (confirm('Are you sure you want to delete this newsletter?')) {
      this.newsletterService.deleteNewsletter(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.newsletters.update(items => items.filter(item => item._id !== id));
            this.loadStats();
            this.showSuccess('Newsletter deleted successfully');
          } else {
            this.showError(response.message || 'Failed to delete newsletter');
          }
        },
        error: (error) => {
          console.error('Error deleting newsletter:', error);
          this.showError('Failed to delete newsletter');
        }
      });
    }
  }

  // Updated duplicateNewsletter method
  duplicateNewsletter(id: string): void {
    this.newsletterService.duplicateNewsletter(id).subscribe({
      next: (response) => {
        if (response.success) {
          this.newsletters.update(items => [response.data, ...items]);
          this.loadStats();
          this.showSuccess('Newsletter duplicated successfully');
        } else {
          this.showError(response.message || 'Failed to duplicate newsletter');
        }
      },
      error: (error) => {
        console.error('Error duplicating newsletter:', error);
        this.showError('Failed to duplicate newsletter');
      }
    });
  }

  // Utility methods for notifications
  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }


  // File upload method (optional enhancement)
  onFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (!file) return;

    // Basic CSV file validation
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.processCSVFile(content);
    };
    reader.readAsText(file);
  }

  private processCSVFile(content: string): void {
    const lines = content.split('\n');
    const emails: string[] = [];

    lines.forEach(line => {
      const email = line.split(',')[0]?.trim(); // Assume email is in first column
      if (email && this.isValidEmail(email)) {
        emails.push(email);
      }
    });

    // Remove duplicates
    const uniqueEmails = [...new Set(emails)];
    
    if (uniqueEmails.length > 0) {
      this.form.get('externalEmails')?.setValue(uniqueEmails.join('\n'));
      this.validateExternalEmails();
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Actions
  createNewsletter(): void {
    this.showForm.set(true);
    this.editingId.set(null);
    this.form.reset({
      recipientType: 'all',
      sendOption: 'draft',
      scheduledDate: new Date(),
      scheduledTime: '09:00'
    });
    this.invalidEmails.set([]);
  }

  editNewsletter(id: string): void {
    const newsletter = this.newsletters().find(n => n._id === id);
    if (newsletter) {
      this.showForm.set(true);
      this.editingId.set(id);
      
      this.form.patchValue({
        subject: newsletter.subject,
        previewText: newsletter.previewText,
        content: newsletter.content,
        recipientType: newsletter.recipientType,
        externalEmails: newsletter.externalEmails?.join('\n') || '',
        sendOption: newsletter.status === 'draft' ? 'draft' : 'now'
      });
      
      this.validateExternalEmails();
    }
  }

  cancelEdit(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
    this.invalidEmails.set([]);
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onFilterChange(status: string): void {
    this.filterStatus.set(status);
  }


  private getNewsletterStatus(sendOption: string): 'draft' | 'scheduled' | 'sent' {
    switch (sendOption) {
      case 'now': return 'sent';
      case 'schedule': return 'scheduled';
      default: return 'draft';
    }
  }

  private getSentDate(formValue: any): Date {
    switch (formValue.sendOption) {
      case 'schedule': 
        return new Date(`${formValue.scheduledDate} ${formValue.scheduledTime}`);
      case 'now':
        return new Date();
      default:
        return new Date();
    }
  }

  getActionText(): string {
    const option = this.form.get('sendOption')?.value;
    switch (option) {
      case 'now': return 'Send Now';
      case 'schedule': return 'Schedule';
      default: return 'Save Draft';
    }
  }

 



  // Date utility
  get minDate(): Date {
    return new Date();
  }
}