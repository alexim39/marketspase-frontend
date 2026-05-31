import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { ContactComponent } from '../contact/contact.component';
import { SupportService } from '../support.service';
import { SupportComponent } from '../support.component';
import { TestimonialWriteupSettingsComponent } from '../testimonial-writeup/testimonial-writeup.component';

type SupportSectionId = 'contact' | 'testimonial';

interface SupportSection {
  id: SupportSectionId;
  icon: string;
  label: string;
  description: string;
}

@Component({
  selector: 'async-support-mobile',
  standalone: true,
  providers: [SupportService],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ContactComponent,
    TestimonialWriteupSettingsComponent,
  ],
  templateUrl: './support-mobile.component.html',
  styleUrls: ['./support-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportMobileComponent extends SupportComponent {
  private readonly snackBar = inject(MatSnackBar);

  readonly activeSection = signal<SupportSectionId>('contact');

  readonly sections: SupportSection[] = [
    {
      id: 'contact',
      icon: 'support_agent',
      label: 'Contact',
      description: 'Send a support request or jump into WhatsApp live help',
    },
    {
      id: 'testimonial',
      icon: 'rate_review',
      label: 'Testimonial',
      description: 'Share your MarketSpase experience and update your rating',
    },
  ];

  readonly testimonialStatus = computed(() => {
    if (this.isLoading()) return 'Loading';
    if (this.error()) return 'Needs retry';
    const testimonial = this.testimonial();
    if (testimonial?.message) return `${testimonial.rating || 0}/5`;
    return 'Not posted';
  });

  readonly supportStats = computed(() => {
    const testimonial = this.testimonial();
    return [
      {
        icon: 'schedule',
        label: 'Response',
        value: '24 hours',
        tone: 'good',
      },
      {
        icon: 'chat',
        label: 'Live chat',
        value: 'WhatsApp',
        tone: 'good',
      },
      {
        icon: testimonial?.message ? 'star' : 'edit_note',
        label: 'Review',
        value: this.testimonialStatus(),
        tone: testimonial?.message ? 'good' : 'warn',
      },
    ];
  });

  readonly guidance = computed(() => {
    if (this.activeSection() === 'testimonial') {
      if (this.isLoading()) return 'We are checking your existing testimonial before showing the editor.';
      if (this.testimonial()?.message) return 'Your testimonial is live. You can update it if your experience has changed.';
      return 'A short testimonial helps other businesses and promoters trust the platform faster.';
    }

    return 'For urgent account, wallet, campaign, or storefront issues, WhatsApp is the fastest support path.';
  });

  selectSection(section: SupportSectionId): void {
    this.activeSection.set(section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  sectionStatus(section: SupportSectionId): string {
    if (section === 'testimonial') return this.testimonialStatus();
    return 'Ready';
  }

  openLiveChat(): void {
    this.openExternal('https://wa.me/2349062537816', 'Opening WhatsApp live chat...');
  }

  openWhatsAppChannel(): void {
    this.openExternal('https://whatsapp.com/channel/0029Vb77xA51NCrKysUMO11D', 'Opening WhatsApp channel...');
  }

  private openExternal(url: string, message: string): void {
    this.snackBar.open(message, 'Close', { duration: 2500 });
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
