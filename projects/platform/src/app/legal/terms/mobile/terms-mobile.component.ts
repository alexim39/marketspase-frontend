import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TermsComponent } from '../terms.component';

type TermsSheet = 'section' | 'rules' | 'contact' | null;

interface TermsStat {
  icon: string;
  value: string;
  label: string;
}

interface TermsSection {
  icon: string;
  title: string;
  summary: string;
  detail: string;
  bullets: string[];
}

interface ConductRule {
  icon: string;
  title: string;
  description: string;
  tone: 'good' | 'warn' | 'bad';
}

@Component({
  selector: 'app-terms-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './terms-mobile.component.html',
  styleUrls: ['./terms-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsMobileComponent extends TermsComponent {
  protected readonly activeSheet = signal<TermsSheet>(null);
  protected readonly selectedSection = signal<TermsSection | null>(null);

  protected readonly contactEmail = 'contacts@marketspase.com';
  protected readonly contactHref = 'mailto:contacts@marketspase.com?subject=MarketSpase%20terms%20question';

  protected readonly termsStats: TermsStat[] = [
    { icon: 'event_available', value: '01/06/2024', label: 'Last updated' },
    { icon: 'gavel', value: 'Binding', label: 'Use agreement' },
    { icon: 'admin_panel_settings', value: 'Account', label: 'User duties' },
    { icon: 'verified_user', value: '18+', label: 'Age guidance' },
  ];

  protected readonly termsSections: TermsSection[] = [
    {
      icon: 'handshake',
      title: 'Agreement to use MarketSpase',
      summary: 'By using or accessing the website, users agree to be legally bound by the terms.',
      detail: 'The terms explain the conditions for accessing, viewing, using, or downloading materials from the MarketSpase website. Continued use means continued agreement to any updated terms.',
      bullets: ['Use of the website means acceptance', 'Terms may be updated over time', 'Stop using the website if you disagree'],
    },
    {
      icon: 'upload_file',
      title: 'User-submitted content',
      summary: 'Users are responsible for content they submit through the website or email.',
      detail: 'Submitted information should be truthful, accurate, not misleading, and shared in good faith. Users should avoid sending confidential or proprietary information unless MarketSpase specifically requests it.',
      bullets: ['Submit accurate information', 'Do not send unsolicited confidential ideas', 'Respect third-party copyright and trademark rights'],
    },
    {
      icon: 'manage_accounts',
      title: 'Registration and account security',
      summary: 'Registered users must keep account details accurate and protect login credentials.',
      detail: 'Secure users are responsible for activity under their account, password confidentiality, one active account, and prompt notice if they discover unauthorized use or a security breach.',
      bullets: ['Keep profile information current', 'Protect passwords and sessions', 'Report unauthorized access quickly'],
    },
    {
      icon: 'security',
      title: 'Website security',
      summary: 'Attempts to violate website security may lead to civil, criminal, or platform action.',
      detail: 'MarketSpase may investigate suspected security violations and cooperate with law enforcement where a criminal violation is suspected.',
      bullets: ['Do not attempt unauthorized access', 'Do not disrupt platform operations', 'Do not use malicious code'],
    },
    {
      icon: 'block',
      title: 'Unauthorized or harmful use',
      summary: 'The terms prohibit fraud, impersonation, abuse, harassment, malicious files, scraping, and misuse.',
      detail: 'Users must comply with applicable laws and respect other users. The website must not be used for unlawful, infringing, fraudulent, harmful, or disruptive activity.',
      bullets: ['No fraud or unlawful activity', 'No impersonation or harassment', 'No copying, reselling, or reverse engineering'],
    },
    {
      icon: 'copyright',
      title: 'Intellectual property',
      summary: 'MarketSpase content, design, marks, databases, and related rights are protected.',
      detail: 'Website content, trademarks, logos, trade names, product names, and designs may not be copied, modified, republished, distributed, or used without the required permission.',
      bullets: ['Respect copyright notices', 'Do not misuse trademarks or logos', 'Send infringement notices to the listed contact'],
    },
    {
      icon: 'open_in_new',
      title: 'Third-party links and social pages',
      summary: 'External websites, third-party resources, and social pages have their own terms and risks.',
      detail: 'MarketSpase may link to external websites for convenience, but users visit those destinations at their own risk and should follow each platform or website terms.',
      bullets: ['External sites are separate', 'Use third-party resources at your own risk', 'Social page comments may not represent MarketSpase'],
    },
    {
      icon: 'report',
      title: 'Disclaimers, limits and indemnity',
      summary: 'The terms include warranty disclaimers, liability limits, termination rights, and indemnity obligations.',
      detail: 'The agreement explains that content is provided as available, outlines limitations of liability, and requires users to defend MarketSpase from claims caused by breach, misuse, or unsolicited submissions.',
      bullets: ['Website content may be provided as available', 'Certain damages may be excluded where law allows', 'Breaches can create responsibility for claims'],
    },
    {
      icon: 'contact_support',
      title: 'Contact and questions',
      summary: 'Questions about the agreement or website operation can be sent to MarketSpase support.',
      detail: 'For terms, technical, or agreement questions, users can contact MarketSpase through the official email address listed in the policy.',
      bullets: ['Use the official contact email', 'Include relevant account details', 'Ask about unclear agreement points'],
    },
  ];

  protected readonly conductRules: ConductRule[] = [
    {
      icon: 'check_circle',
      title: 'Use the platform honestly',
      description: 'Provide accurate information, follow posted rules, and respect other users.',
      tone: 'good',
    },
    {
      icon: 'warning',
      title: 'Protect your account',
      description: 'Keep passwords private, update your details, and report unauthorized access quickly.',
      tone: 'warn',
    },
    {
      icon: 'gpp_bad',
      title: 'Avoid prohibited activity',
      description: 'Fraud, impersonation, malicious code, harassment, and unauthorized copying can trigger enforcement.',
      tone: 'bad',
    },
  ];

  protected openSection(section: TermsSection): void {
    this.selectedSection.set(section);
    this.activeSheet.set('section');
  }

  protected openRules(): void {
    this.activeSheet.set('rules');
  }

  protected openContact(): void {
    this.activeSheet.set('contact');
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
    this.selectedSection.set(null);
  }
}
