// contact.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';

interface ContactMethod {
  icon: string;
  title: string;
  description: string;
  value: string;
  action?: string;
  gradient: string;
}

interface TeamMember {
  name: string;
  role: string;
  department: string;
  email: string;
  avatar: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    FooterComponent,
    HeaderComponent
  ],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  isSubmitting = signal(false);
  openFaqItems = signal<Set<number>>(new Set());

  contactForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    phone: [''],
    inquiryType: ['general', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
    newsletter: [true],
    terms: [false, Validators.requiredTrue]
  });

  contactMethods = signal<ContactMethod[]>([
    {
      icon: 'email',
      title: 'Email Support',
      description: 'Send us a detailed message and we\'ll respond within hours',
      value: 'support@marketspase.com',
      action: 'Send Email',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: 'chat',
      title: 'Live Chat',
      description: 'Get instant help from our support team in real-time',
      value: 'Available 24/7',
      action: 'Start Chat',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: 'phone',
      title: 'Phone Support',
      description: 'Prefer to talk? Call us during business hours',
      value: '+1 (555) 123-4567',
      action: 'Call Now',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: 'forum',
      title: 'Community Forum',
      description: 'Get help from other marketers and promoters',
      value: 'community.marketspase.com',
      action: 'Visit Forum',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ]);

  teamMembers = signal<TeamMember[]>([
    {
      name: 'Sarah Chen',
      role: 'Support Lead',
      department: 'Customer Success',
      email: 'sarah@marketspase.com',
      avatar: '/assets/team/sarah.jpg'
    },
    {
      name: 'Marcus Johnson',
      role: 'Technical Specialist',
      department: 'Engineering',
      email: 'marcus@marketspase.com',
      avatar: '/assets/team/marcus.jpg'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Account Manager',
      department: 'Business Development',
      email: 'elena@marketspase.com',
      avatar: '/assets/team/elena.jpg'
    },
    {
      name: 'David Kim',
      role: 'Campaign Specialist',
      department: 'Marketing Operations',
      email: 'david@marketspase.com',
      avatar: '/assets/team/david.jpg'
    }
  ]);

  handleContactAction(method: ContactMethod): void {
    switch (method.title) {
      case 'Email Support':
        window.location.href = `mailto:${method.value}`;
        break;
      case 'Live Chat':
        this.startLiveChat();
        break;
      case 'Phone Support':
        window.location.href = `tel:${method.value}`;
        break;
      case 'Community Forum':
        window.open('https://community.marketspase.com', '_blank');
        break;
    }
  }

  startLiveChat(): void {
    this.snackBar.open('Opening live chat...', 'Close', { duration: 3000 });
    // Implement live chat integration here
  }

  emailTeamMember(member: TeamMember): void {
    window.location.href = `mailto:${member.email}`;
  }

  scheduleDemo(): void {
    this.snackBar.open('Redirecting to demo scheduling...', 'Close', { duration: 3000 });
    // Implement demo scheduling logic here
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.isSubmitting.set(true);
      
      // Simulate API call
      setTimeout(() => {
        this.isSubmitting.set(false);
        this.snackBar.open('Message sent successfully! We\'ll get back to you soon.', 'Close', { duration: 5000 });
        this.contactForm.reset({
          inquiryType: 'general',
          newsletter: true,
          terms: false
        });
      }, 2000);
    }
  }

  toggleFaq(index: number): void {
    const currentOpenItems = new Set(this.openFaqItems());
    if (currentOpenItems.has(index)) {
      currentOpenItems.delete(index);
    } else {
      currentOpenItems.add(index);
    }
    this.openFaqItems.set(currentOpenItems);
  }

  isFaqOpen(index: number): boolean {
    return this.openFaqItems().has(index);
  }
}