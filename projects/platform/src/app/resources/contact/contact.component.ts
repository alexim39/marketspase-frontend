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
import { HttpErrorResponse } from '@angular/common/http';
import { ContactFormData, ContactService } from './contact.service';

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
  providers: [ContactService],
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
  private contactService = inject(ContactService);

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
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)'
    },
    {
      icon: 'phone',
      title: 'Phone Support',
      description: 'Prefer to talk? Call us during business hours',
      value: '+234 906 253 7816',
      action: 'Call Now',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #10888eff 100%)'
    },
   /*  {
      icon: 'forum',
      title: 'Community Forum',
      description: 'Get help from other marketers and promoters',
      value: 'community.marketspase.com',
      action: 'Visit Forum',
      gradient: 'linear-gradient(135deg, #29bd5aff 0%, #107160ff 100%)'
    } */
  ]);

  teamMembers = signal<TeamMember[]>([
    {
      name: 'Sonia',
      role: 'Support Lead',
      department: 'Customer Success',
      email: 'sonia.n@marketspase.com',
      avatar: '/img/resources/avatar/team/sonia.jpg'
    },
    {
      name: 'Alex',
      role: 'Technical Specialist',
      department: 'Software Engineering',
      email: 'alex.i@marketspase.com',
      avatar: '/img/resources/avatar/team/alex.jpg'
    },
    {
      name: 'Jude',
      role: 'Operations Manager',
      department: 'Business Development',
      email: 'jude.a@marketspase.com',
      avatar: '/img/resources/avatar/team/jude.jpg'
    },
    {
      name: 'Angela',
      role: 'Campaign Specialist',
      department: 'Marketing Operations',
      email: 'angela.n@marketspase.com',
      avatar: '/img/resources/avatar/team/angela.jpg'
    },
    {
      name: 'Ola',
      role: 'Technical Specialist',
      department: 'DevOps/Network Engineering',
      email: 'ola.s@marketspase.com',
      avatar: '/img/resources/avatar/team/ola.jpg'
    },
    {
      name: 'Andrew',
      role: 'Technical Specialist',
      department: 'QA Engineering',
      email: 'andrew.a@marketspase.com',
      avatar: '/img/resources/avatar/team/andrew.jpg'
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
       // window.open('https://community.marketspase.com', '_blank');
        break;
    }
  }

 startLiveChat(): void {
    this.snackBar.open('Opening WhatsApp live chat...', 'Close', { duration: 3000 });
    // Opens the WhatsApp chat link in a new tab/window
    window.open('https://wa.me/2349062537816', '_blank');
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

    const formData = this.contactForm.value as ContactFormData;

    this.contactService.submit(formData).subscribe({
      next: (response: any) => {
        this.isSubmitting.set(false);
        this.snackBar.open(response.message, 'Close', { duration: 5000 });
        this.contactForm.reset(); // Reset form after successful submission
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        let errorMessage = 'Server error occurred, please try again.'; // Default error message
        if (error.error && error.error.message) {
          errorMessage = error.error.message; // Use backend's error message if available
        }
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
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