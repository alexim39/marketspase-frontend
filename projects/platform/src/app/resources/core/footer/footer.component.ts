import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface FooterLink {
  label: string;
  route?: string;
  href?: string;
}

interface FooterGroup {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();

  readonly footerGroups: FooterGroup[] = [
    {
      title: 'Platform',
      links: [
        { label: 'Features', route: '/resources/features' },
        { label: 'How it works', route: '/resources/how-it-works' },
        { label: 'Testimonials', route: '/resources/testimonials' },
        { label: 'For marketers', route: '/resources/solutions/marketers' },
        { label: 'For promoters', route: '/resources/solutions/promoters' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About us', route: '/resources/about' },
        { label: 'Careers', route: '/resources/careers' },
        { label: 'Contact', route: '/resources/contact' },
        { label: 'FAQs', route: '/resources/faqs' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy policy', route: '/legal/privacy' },
        { label: 'Terms of service', route: '/legal/terms' },
        { label: 'Cookie policy', route: '/legal/cookies' },
      ],
    },
  ];

  readonly socialLinks = [
    {
      label: 'Facebook',
      href: 'https://www.facebook.com/marketspase',
      icon: 'facebook',
      iconType: 'material',
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/MarketSpaseOnline/',
      icon: 'fa fa-instagram',
      iconType: 'fontawesome',
    },
    {
      label: 'YouTube',
      href: 'https://www.youtube.com/@MarketSpase/videos',
      icon: 'play_circle',
      iconType: 'material',
    },
  ];

  readonly trustItems = [
    { icon: 'verified_user', label: 'Secure tracking' },
    { icon: 'payments', label: 'Escrow-ready payouts' },
    { icon: 'insights', label: 'Real-time analytics' },
  ];

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openWhatsAppChannel(): void {
    window.open('https://whatsapp.com/channel/0029Vb77xA51NCrKysUMO11D', '_blank', 'noopener,noreferrer');
  }
}
