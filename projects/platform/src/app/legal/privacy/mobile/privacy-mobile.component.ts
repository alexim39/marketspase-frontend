import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { PrivacyComponent } from '../privacy.component';

type PrivacySheet = 'section' | 'rights' | 'contact' | null;

interface PrivacyStat {
  icon: string;
  value: string;
  label: string;
}

interface PrivacySection {
  icon: string;
  title: string;
  summary: string;
  detail: string;
  bullets: string[];
}

interface PrivacyRight {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-privacy-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './privacy-mobile.component.html',
  styleUrls: ['./privacy-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyMobileComponent extends PrivacyComponent {
  protected readonly activeSheet = signal<PrivacySheet>(null);
  protected readonly selectedSection = signal<PrivacySection | null>(null);

  protected readonly contactEmail = 'contacts@marketspase.com';
  protected readonly contactHref = 'mailto:contacts@marketspase.com?subject=MarketSpase%20privacy%20question';

  protected readonly privacyStats: PrivacyStat[] = [
    { icon: 'event_available', value: 'June 2024', label: 'Last updated' },
    { icon: 'language', value: 'Website', label: 'Policy scope' },
    { icon: 'lock', value: 'Secure', label: 'Data handling' },
    { icon: 'verified_user', value: 'Control', label: 'User rights' },
  ];

  protected readonly policySections: PrivacySection[] = [
    {
      icon: 'inventory_2',
      title: 'Information we collect',
      summary: 'We collect information shared through website visits, forms, communication, and public professional context.',
      detail: 'This includes website usage, contact form entries, newsletter or resource signups, support communication, and professional information that is already public.',
      bullets: ['Website traffic and behavior', 'Form and contact details', 'Professional public information'],
    },
    {
      icon: 'task_alt',
      title: 'How we use information',
      summary: 'Data is used to provide services, respond to requests, support customers, and share updates when allowed.',
      detail: 'MarketSpase uses collected information to deliver requested services, meet obligations, send relevant product or policy updates, and improve the website experience.',
      bullets: ['Service delivery and support', 'Requested product information', 'Approved updates and communication'],
    },
    {
      icon: 'analytics',
      title: 'Analytics and cookies',
      summary: 'Google Analytics may help us understand non-personal website usage patterns.',
      detail: 'Analytics data helps us understand aggregate behavior, site performance, and content usefulness. Cookie details are covered separately in the Cookies Policy.',
      bullets: ['Aggregate usage insights', 'Website performance signals', 'Separate cookie policy'],
    },
    {
      icon: 'encrypted',
      title: 'Storage and protection',
      summary: 'We use secure servers, encrypted transactions, limited internal access, and HTTPS practices.',
      detail: 'Information is stored on secure servers. Access is limited to employees who need it for specific work such as support, billing, or service operations.',
      bullets: ['Secure server storage', 'Encrypted transaction handling', 'Limited employee access'],
    },
    {
      icon: 'share_off',
      title: 'Disclosure rules',
      summary: 'We do not sell, rent, distribute, or transfer personal data except where law or fraud protection requires it.',
      detail: 'Personal information is not disclosed to third parties unless legally required, needed to assist fraud protection, or needed to minimize credit risk.',
      bullets: ['No sale of personal data', 'Legal compliance exceptions', 'Fraud protection exceptions'],
    },
    {
      icon: 'manage_accounts',
      title: 'Your control',
      summary: 'You can opt out, request access, correct information, request deletion, or raise concerns.',
      detail: 'You can unsubscribe from future email contact or contact MarketSpase to access, update, correct, delete, or ask about data held about you.',
      bullets: ['Opt out of emails', 'Access or correct data', 'Request deletion or raise concerns'],
    },
    {
      icon: 'link',
      title: 'Third-party links and minors',
      summary: 'External websites have their own policies, and minors need appropriate guardian consent before submitting information.',
      detail: 'MarketSpase is not responsible for third-party privacy policies. Minors should only submit information where their local law permits it and with guardian consent where needed.',
      bullets: ['External policies may differ', 'Guardian consent may be required', 'No intentional child data collection'],
    },
  ];

  protected readonly rights: PrivacyRight[] = [
    {
      icon: 'visibility',
      title: 'See your data',
      description: 'Ask what data MarketSpase has about you, where applicable.',
    },
    {
      icon: 'edit_note',
      title: 'Correct your data',
      description: 'Request updates or corrections to information that is inaccurate.',
    },
    {
      icon: 'delete_outline',
      title: 'Request deletion',
      description: 'Ask us to delete data unless we need it for a legal obligation.',
    },
    {
      icon: 'unsubscribe',
      title: 'Opt out',
      description: 'Use unsubscribe links or contact us to stop future email contact.',
    },
  ];

  protected openSection(section: PrivacySection): void {
    this.selectedSection.set(section);
    this.activeSheet.set('section');
  }

  protected openRights(): void {
    this.activeSheet.set('rights');
  }

  protected openContact(): void {
    this.activeSheet.set('contact');
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
    this.selectedSection.set(null);
  }
}
