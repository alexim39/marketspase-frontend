import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../core/header/header.component';
import { FooterComponent } from '../../core/footer/footer.component';
import { ContactComponent, ContactMethod, TeamMember } from '../contact.component';
import { ContactService } from '../contact.service';

type ContactStep = 1 | 2 | 3 | 4;
type ContactSheet = 'channels' | 'team' | 'faq' | null;

@Component({
  selector: 'app-contact-mobile',
  standalone: true,
  providers: [ContactService],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatIconModule,
    MatSnackBarModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: './contact-mobile.component.html',
  styleUrls: ['./contact-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactMobileComponent extends ContactComponent {
  readonly currentStep = signal<ContactStep>(1);
  readonly activeSheet = signal<ContactSheet>(null);
  readonly selectedMethod = signal<ContactMethod | null>(null);
  readonly selectedTeamMember = signal<TeamMember | null>(null);

  readonly inquiryOptions = [
    { value: 'general', label: 'General help', icon: 'help' },
    { value: 'marketer', label: 'Campaign support', icon: 'campaign' },
    { value: 'promoter', label: 'Promoter account', icon: 'workspace_premium' },
    { value: 'technical', label: 'Technical issue', icon: 'bug_report' },
    { value: 'billing', label: 'Billing or wallet', icon: 'payments' },
    { value: 'partnership', label: 'Partnership', icon: 'handshake' },
  ];

  readonly mobileFaqs = [
    {
      question: 'How fast will support respond?',
      answer: 'Most support requests are answered within 2-4 hours. Urgent issues are best handled through WhatsApp live chat.',
    },
    {
      question: 'What should I include?',
      answer: 'Include your account email, campaign or store ID where available, screenshots, and a clear description of what happened.',
    },
    {
      question: 'Can I get help with payments?',
      answer: 'Yes. Choose Billing or wallet and include the wallet transaction, campaign, or order reference.',
    },
  ];

  readonly progress = computed(() => `${this.currentStep()} of 4`);
  readonly topTeamMembers = computed(() => this.teamMembers().slice(0, 4));

  readonly selectedInquiryLabel = computed(() => {
    const value = this.contactForm.get('inquiryType')?.value;
    return this.inquiryOptions.find((option) => option.value === value)?.label || 'General help';
  });

  selectMethod(method: ContactMethod): void {
    this.selectedMethod.set(method);
  }

  selectInquiry(value: string): void {
    this.contactForm.get('inquiryType')?.setValue(value);
  }

  setStep(step: ContactStep): void {
    this.currentStep.set(step);
  }

  nextStep(): void {
    const step = this.currentStep();
    if (step === 2 && !this.validateControls(['fullName', 'email', 'phone'])) return;
    if (step === 3 && !this.validateControls(['message'])) return;

    this.currentStep.set(Math.min(step + 1, 4) as ContactStep);
  }

  previousStep(): void {
    const step = this.currentStep();
    this.currentStep.set(Math.max(step - 1, 1) as ContactStep);
  }

  openSheet(sheet: ContactSheet): void {
    this.activeSheet.set(sheet);
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  openTeamMember(member: TeamMember): void {
    this.selectedTeamMember.set(member);
    this.activeSheet.set('team');
  }

  submitMobileForm(): void {
    if (!this.validateControls(['fullName', 'email', 'message', 'terms'])) return;
    this.onSubmit();
  }

  methodTone(index: number): string {
    return ['tone-blue', 'tone-purple', 'tone-cyan'][index % 3];
  }

  private validateControls(controlNames: string[]): boolean {
    let valid = true;

    for (const name of controlNames) {
      const control = this.contactForm.get(name);
      if (!control) continue;
      control.markAsTouched();
      control.updateValueAndValidity();
      valid = valid && control.valid;
    }

    return valid;
  }
}
