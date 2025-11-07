import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { LoadingService } from '../../../../shared-services/src/public-api';

interface Newsletter {
  id: string;
  subject: string;
  previewText: string;
  content: string;
  recipientType: 'all' | 'marketers' | 'promoters' | 'custom';
  customEmails?: string[];
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'sent';
  sentDate: Date;
  openRate: number;
  clickRate: number;
}

interface NewsletterStats {
  totalSent: number;
  scheduled: number;
  openRate: number;
  clickRate: number;
}

@Component({
  selector: 'app-newsletter-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public loadingService = inject(LoadingService);

  // Signals
  showNewsletterForm = signal(false);
  editingNewsletter = signal<string | null>(null);
  searchQuery = signal('');
  filterStatus = signal('all');
  isSubmitting = signal(false);
  
  // Sample data - replace with actual API calls
  newsletters = signal<Newsletter[]>([
    {
      id: '1',
      subject: 'Welcome to Our New Platform Features',
      previewText: 'Discover the latest updates and how they benefit you...',
      content: '<p>Welcome to our new platform features...</p>',
      recipientType: 'all',
      recipientCount: 1250,
      status: 'sent',
      sentDate: new Date('2024-01-15'),
      openRate: 42,
      clickRate: 18
    },
    {
      id: '2',
      subject: 'Important Update for Marketers',
      previewText: 'New campaign tools and analytics available...',
      content: '<p>Dear marketers, we have exciting news...</p>',
      recipientType: 'marketers',
      recipientCount: 450,
      status: 'scheduled',
      sentDate: new Date('2024-01-20'),
      openRate: 0,
      clickRate: 0
    },
    {
      id: '3',
      subject: 'Promoter Earnings Report - Q1 2024',
      previewText: 'See how promoters are earning with our platform...',
      content: '<p>Check out the latest earnings report...</p>',
      recipientType: 'promoters',
      recipientCount: 800,
      status: 'draft',
      sentDate: new Date(),
      openRate: 0,
      clickRate: 0
    }
  ]);

  stats = signal<NewsletterStats>({
    totalSent: 45,
    scheduled: 3,
    openRate: 38.5,
    clickRate: 12.2
  });

  // Form
  newsletterForm: FormGroup;

  // Computed signals
  filteredNewsletters = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const statusFilter = this.filterStatus();
    
    return this.newsletters().filter(newsletter => {
      const matchesSearch = newsletter.subject.toLowerCase().includes(query) ||
                           newsletter.previewText.toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || newsletter.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  });

  estimatedRecipients = computed(() => {
        const recipientType = this.newsletterForm.get('recipientType')?.value as 'all' | 'marketers' | 'promoters' | 'custom';
        
        const userCounts = {
            all: 1250,
            marketers: 450,
            promoters: 800,
            custom: 0
        };

        if (recipientType === 'custom') {
            const emails = this.newsletterForm.get('customEmails')?.value || '';
            return emails.split(',').filter((email: string) => email.trim()).length;
        }
        
        return userCounts[recipientType] || 0;
    });

  previewContent = computed(() => {
    const content = this.newsletterForm.get('content')?.value || '';
    // Basic HTML formatting for preview
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  });

  constructor() {
    this.newsletterForm = this.createNewsletterForm();
  }

  ngOnInit(): void {
    // Initialize with current date as minimum for scheduling
    this.newsletterForm.get('scheduledDate')?.setValue(new Date());
    this.newsletterForm.get('scheduledTime')?.setValue('09:00');
  }

  private createNewsletterForm(): FormGroup {
    return this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(5)]],
      previewText: ['', [Validators.maxLength(150)]],
      content: ['', [Validators.required, Validators.minLength(50)]],
      recipientType: ['all', Validators.required],
      customEmails: [''],
      sendOption: ['now', Validators.required],
      scheduledDate: [new Date()],
      scheduledTime: ['09:00']
    });
  }

  // UI Actions
  createNewNewsletter(): void {
    this.showNewsletterForm.set(true);
    this.editingNewsletter.set(null);
    this.newsletterForm.reset({
      recipientType: 'all',
      sendOption: 'now',
      scheduledDate: new Date(),
      scheduledTime: '09:00'
    });
  }

  editNewsletter(id: string): void {
    const newsletter = this.newsletters().find(n => n.id === id);
    if (newsletter) {
      this.showNewsletterForm.set(true);
      this.editingNewsletter.set(id);
      
      this.newsletterForm.patchValue({
        subject: newsletter.subject,
        previewText: newsletter.previewText,
        content: newsletter.content,
        recipientType: newsletter.recipientType,
        customEmails: newsletter.customEmails?.join(', ') || '',
        sendOption: newsletter.status === 'draft' ? 'draft' : 'now'
      });
    }
  }

  cancelEdit(): void {
    this.showNewsletterForm.set(false);
    this.editingNewsletter.set(null);
    this.newsletterForm.reset();
  }

  onRecipientTypeChange(): void {
    const recipientType = this.newsletterForm.get('recipientType')?.value;
    if (recipientType !== 'custom') {
      this.newsletterForm.get('customEmails')?.setValue('');
    }
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
  }

  onFilterChange(status: string): void {
    this.filterStatus.set(status);
  }

  // Form Actions
  saveDraft(): void {
    if (this.newsletterForm.invalid) return;
    
    this.isSubmitting.set(true);
    
    // Simulate API call
    setTimeout(() => {
      const formValue = this.newsletterForm.value;
      const newsletter: Newsletter = {
        id: this.editingNewsletter() || Date.now().toString(),
        subject: formValue.subject,
        previewText: formValue.previewText,
        content: formValue.content,
        recipientType: formValue.recipientType,
        customEmails: formValue.recipientType === 'custom' ? 
          formValue.customEmails.split(',').map((email: string) => email.trim()) : undefined,
        recipientCount: this.estimatedRecipients(),
        status: 'draft',
        sentDate: new Date(),
        openRate: 0,
        clickRate: 0
      };

      if (this.editingNewsletter()) {
        // Update existing
        this.newsletters.update(newsletters => 
          newsletters.map(n => n.id === newsletter.id ? newsletter : n)
        );
      } else {
        // Add new
        this.newsletters.update(newsletters => [newsletter, ...newsletters]);
      }

      this.isSubmitting.set(false);
      this.showNewsletterForm.set(false);
      this.newsletterForm.reset();
    }, 1000);
  }

  onSubmit(): void {
    if (this.newsletterForm.invalid) return;

    this.isSubmitting.set(true);
    const formValue = this.newsletterForm.value;
    const sendOption = formValue.sendOption;

    // Simulate API call
    setTimeout(() => {
      const newsletter: Newsletter = {
        id: this.editingNewsletter() || Date.now().toString(),
        subject: formValue.subject,
        previewText: formValue.previewText,
        content: formValue.content,
        recipientType: formValue.recipientType,
        customEmails: formValue.recipientType === 'custom' ? 
          formValue.customEmails.split(',').map((email: string) => email.trim()) : undefined,
        recipientCount: this.estimatedRecipients(),
        status: sendOption === 'schedule' ? 'scheduled' : 'sent',
        sentDate: sendOption === 'schedule' ? 
          new Date(`${formValue.scheduledDate} ${formValue.scheduledTime}`) : new Date(),
        openRate: 0,
        clickRate: 0
      };

      if (this.editingNewsletter()) {
        // Update existing
        this.newsletters.update(newsletters => 
          newsletters.map(n => n.id === newsletter.id ? newsletter : n)
        );
      } else {
        // Add new
        this.newsletters.update(newsletters => [newsletter, ...newsletters]);
      }

      this.isSubmitting.set(false);
      this.showNewsletterForm.set(false);
      this.newsletterForm.reset();
    }, 1500);
  }

  // Utility Methods
  getSubmitButtonText(): string {
    const sendOption = this.newsletterForm.get('sendOption')?.value;
    
    switch (sendOption) {
      case 'now': return 'Send Newsletter';
      case 'schedule': return 'Schedule Newsletter';
      case 'draft': return 'Save as Draft';
      default: return 'Send Newsletter';
    }
  }

  duplicateNewsletter(id: string): void {
    const newsletter = this.newsletters().find(n => n.id === id);
    if (newsletter) {
      const duplicated: Newsletter = {
        ...newsletter,
        id: Date.now().toString(),
        subject: `${newsletter.subject} (Copy)`,
        status: 'draft',
        sentDate: new Date(),
        openRate: 0,
        clickRate: 0
      };
      
      this.newsletters.update(newsletters => [duplicated, ...newsletters]);
    }
  }

  deleteNewsletter(id: string): void {
    if (confirm('Are you sure you want to delete this newsletter?')) {
      this.newsletters.update(newsletters => 
        newsletters.filter(n => n.id !== id)
      );
    }
  }

  // Text formatting helpers
  formatText(format: 'bold' | 'italic' | 'underline'): void {
    const contentControl = this.newsletterForm.get('content');
    const currentValue = contentControl?.value || '';
    const selectionStart = 0; // In real implementation, get from textarea
    const selectionEnd = 0; // In real implementation, get from textarea
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${currentValue.substring(selectionStart, selectionEnd)}**`;
        break;
      case 'italic':
        formattedText = `*${currentValue.substring(selectionStart, selectionEnd)}*`;
        break;
      case 'underline':
        formattedText = `__${currentValue.substring(selectionStart, selectionEnd)}__`;
        break;
    }
    
    // In real implementation, insert at cursor position
    contentControl?.setValue(currentValue + formattedText);
  }

  insertLink(): void {
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Enter link text:', url);
      const contentControl = this.newsletterForm.get('content');
      const currentValue = contentControl?.value || '';
      const linkMarkdown = `[${text}](${url})`;
      contentControl?.setValue(currentValue + linkMarkdown);
    }
  }

  insertImage(): void {
    const url = prompt('Enter image URL:');
    if (url) {
      const alt = prompt('Enter alt text:');
      const contentControl = this.newsletterForm.get('content');
      const currentValue = contentControl?.value || '';
      const imageMarkdown = `![${alt}](${url})`;
      contentControl?.setValue(currentValue + imageMarkdown);
    }
  }

  // Date utilities
  get minDate(): Date {
    return new Date();
  }
}