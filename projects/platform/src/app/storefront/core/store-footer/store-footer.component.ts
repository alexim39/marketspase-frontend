// store-footer.component.ts
import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { TruncatePipe } from '../../../store/shared';

export interface FooterLink {
  label: string;
  route?: string;
  url?: string;
  icon?: string;
  action?: () => void;
}

@Component({
  selector: 'app-store-footer',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,   
    TruncatePipe,
  ],
  templateUrl: './store-footer.component.html',
  styleUrls: ['./store-footer.component.scss']
})
export class StoreFooterComponent implements OnInit, OnDestroy {
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  @Input() store: any | null = null;
  @Input() showNewsletter: boolean = true;
  
  @Output() contactViaWhatsApp = new EventEmitter<void>();
  @Output() subscribeNewsletter = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<string>();

  // Signals
  currentYear = new Date().getFullYear();
  newsletterEmail = '';
  isSubscribing = signal<boolean>(false);
  showBackToTop = signal<boolean>(false);

  // Footer links data
  shopLinks: FooterLink[] = [
    { label: 'All Products', route: 'products', icon: 'inventory_2' },
    { label: 'Featured', route: 'featured', icon: 'star' },
    { label: 'New Arrivals', route: 'new', icon: 'fiber_new' },
    { label: 'On Sale', route: 'sale', icon: 'local_offer' },
    { label: 'Best Sellers', route: 'best-sellers', icon: 'trending_up' }
  ];

  supportLinks: FooterLink[] = [
    { label: 'Contact Us', route: 'contact', icon: 'contact_support' },
    { label: 'Shipping Policy', route: 'shipping', icon: 'local_shipping' },
    { label: 'Returns & Refunds', route: 'returns', icon: 'assignment_return' },
    { label: 'FAQ', route: 'faq', icon: 'help' },
    //{ label: 'Track Order', route: 'track-order', icon: 'track_changes' }
  ];

  companyLinks: FooterLink[] = [
    { label: 'About Us', route: 'about', icon: 'info' },
    { label: 'Careers', route: 'careers', icon: 'work' },
    //{ label: 'Blog', route: 'blog', icon: 'rss_feed' },
    //{ label: 'Press', route: 'press', icon: 'newspaper' },
    //{ label: 'Affiliates', route: 'affiliates', icon: 'people' }
  ];

  legalLinks: FooterLink[] = [
    { label: 'Privacy Policy', route: '/legal/privacy' },
    { label: 'Terms of Service', route: '/legal/terms' },
    { label: 'Cookie Policy', route: '/legal/cookies' },
    //{ label: 'Accessibility', route: '/legal/accessibility' }
  ];

  socialLinks = [
    { 
      name: 'Facebook', 
      icon: 'facebook', 
      url: 'https://www.facebook.com/marketspase',
      image: '/img/social/facebook.png'
    },
    // { 
    //   name: 'Twitter', 
    //   icon: 'twitter', 
    //   url: 'https://x.com/MarketSpase',
    //   image: '/img/social/x.jpg'
    // },
    { 
      name: 'Instagram', 
      icon: 'instagram', 
      url: 'https://www.instagram.com/MarketSpaseOnline/',
      image: '/img/social/instagram.png'
    },
    // { 
    //   name: 'TikTok', 
    //   icon: 'tiktok', 
    //   url: 'http://tiktok.com/@marketspaseonline',
    //   image: '/img/social/tiktok.png'
    // },
    { 
      name: 'WhatsApp', 
      icon: 'whatsapp', 
      action: 'whatsapp',
      condition: () => this.store?.whatsappNumber,
      image: '<i class="fa fa-whatsapp" aria-hidden="true"></i>'
    }
  ];

  paymentMethods = [
    { name: 'Visa', icon: '<i class="fa fa-cc-visa" aria-hidden="true"></i>', image: '/payment/visa.jpg' },
    { name: 'Mastercard', icon: '<i class="fa fa-cc-mastercard" aria-hidden="true"></i>', image: '/payment/mastercard.png' },
    //{ name: 'PayPal', icon: '/img/payment/paypal.svg' },
    //{ name: 'Apple Pay', icon: '/img/payment/apple-pay.svg' },
    //{ name: 'Google Pay', icon: '/img/payment/google-pay.svg' }
  ];

  languages = [
    { code: 'en', label: 'English (US)' },
    //{ code: 'es', label: 'Español' },
    //{ code: 'fr', label: 'Français' },
    //{ code: 'de', label: 'Deutsch' }
  ];

  selectedLanguage = 'en';

  ngOnInit(): void {
    this.checkScroll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.checkScroll();
  }

  private checkScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    this.showBackToTop.set(scrollTop > 500);
  }

  onSubscribe(): void {
    if (!this.newsletterEmail || !this.isValidEmail(this.newsletterEmail)) {
      this.snackBar.open('Please enter a valid email address', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSubscribing.set(true);
    this.subscribeNewsletter.emit(this.newsletterEmail);

    // Simulate API call (remove in production)
    setTimeout(() => {
      this.isSubscribing.set(false);
      this.newsletterEmail = '';
      this.snackBar.open('Successfully subscribed to newsletter!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
    }, 1500);
  }

  onContactWhatsApp(): void {
    this.contactViaWhatsApp.emit();
  }

  onLanguageChange(lang: string): void {
    this.selectedLanguage = lang;
    this.languageChange.emit(lang);
    
    this.snackBar.open(`Language changed to ${this.getLanguageLabel(lang)}`, 'Close', {
      duration: 2000
    });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getLanguageLabel(code: string): string {
    const lang = this.languages.find(l => l.code === code);
    return lang?.label || code;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getStoreInitials(): string {
    if (!this.store?.name) return 'ST';
    return this.store.name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  hasSocialMedia(): boolean {
    return this.socialLinks.some(link => 
      link.action === 'whatsapp' ? this.store?.whatsappNumber : true
    );
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = '/img/placeholder.svg';
  }
}