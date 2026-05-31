import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from '../../core/footer/footer.component';
import { HeaderComponent } from '../../core/header/header.component';
import { Feature, ForMarketersComponent, PricingTier, Testimonial, UseCase } from '../for-marketers.component';

type MarketerSheet = 'feature' | 'use-case' | 'process' | 'pricing' | 'testimonial' | 'faq' | null;

interface MobileFeature {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
}

interface ProcessStep {
  number: string;
  icon: string;
  title: string;
  description: string;
  details: string[];
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-for-marketers-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './for-marketers-mobile.component.html',
  styleUrls: ['./for-marketers-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForMarketersMobileComponent extends ForMarketersComponent {
  protected readonly activeSheet = signal<MarketerSheet>(null);
  protected readonly selectedFeature = signal<Feature | MobileFeature | null>(null);
  protected readonly selectedUseCase = signal<UseCase | null>(null);
  protected readonly selectedStep = signal<ProcessStep | null>(null);
  protected readonly selectedPricing = signal<PricingTier | null>(null);
  protected readonly selectedTestimonial = signal<Testimonial | null>(null);
  protected readonly selectedFaq = signal<FaqItem | null>(null);
  protected readonly activeUseCaseIndex = signal(0);

  protected readonly heroStats = [
    { icon: 'ads_click', value: 'PPC', label: 'Tracked campaign model' },
    { icon: 'savings', value: '10%', label: 'Deposit service charge' },
    { icon: 'groups', value: '50K+', label: 'Promoter network' },
    { icon: 'query_stats', value: 'Live', label: 'Click analytics' },
  ];

  protected readonly ppcFeatures: MobileFeature[] = [
    {
      icon: 'link',
      title: 'Unique tracked links',
      description: 'Every promoter gets a campaign or product link that records clicks, referrals, and conversions.',
      bullets: ['Promoter-level attribution', 'Click and conversion records', 'Safer sharing across WhatsApp and social platforms'],
    },
    {
      icon: 'account_balance_wallet',
      title: 'Budget protection',
      description: 'Campaign spend is controlled by budget, click cost, fraud checks, and wallet movement guards.',
      bullets: ['Fund campaigns before launch', 'Track available budget', 'Reduce accidental overspend'],
    },
    {
      icon: 'shield',
      title: 'Fraud visibility',
      description: 'Suspicious click patterns, low conversion quality, and repeated abuse can be surfaced for review.',
      bullets: ['IP and device signals', 'Promoter quality history', 'Admin review workflow'],
    },
    {
      icon: 'storefront',
      title: 'Storefront product promotion',
      description: 'Products can be promoted with referral links so marketers can see the promoter behind product sales.',
      bullets: ['Product-level analytics', 'Promoter-driven sales', 'Order and payout visibility'],
    },
  ];

  protected readonly processSteps: ProcessStep[] = [
    {
      number: '01',
      icon: 'campaign',
      title: 'Create campaign',
      description: 'Add the offer, campaign copy, media, landing link, audience notes, and cost-per-click rules.',
      details: ['Set campaign objective', 'Upload approved media', 'Define PPC budget and limits'],
    },
    {
      number: '02',
      icon: 'payments',
      title: 'Fund budget',
      description: 'Deposit funds into the campaign budget so verified promoter traffic can be paid safely.',
      details: ['Budget-first launch', 'Wallet movement guards', 'Top-up support when budget runs low'],
    },
    {
      number: '03',
      icon: 'share',
      title: 'Promoters share links',
      description: 'Promoters copy their unique link and promote it through WhatsApp, social platforms, or store product posts.',
      details: ['Unique promoter attribution', 'No manual screenshot dependency', 'Works across social channels'],
    },
    {
      number: '04',
      icon: 'analytics',
      title: 'Track performance',
      description: 'Watch clicks, unique clicks, orders, conversion quality, fraud signals, and budget usage in analytics.',
      details: ['Real-time click data', 'Conversion rate monitoring', 'Promoter performance comparison'],
    },
  ];

  protected readonly faqs: FaqItem[] = [
    {
      question: 'What does the marketer pay for?',
      answer: 'The current model is built around tracked campaign or product links. Marketers fund a campaign budget and performance is measured through click, referral, and conversion records.',
    },
    {
      question: 'Can I see which promoter drove sales?',
      answer: 'Yes. Promoter links are unique, so product clicks, orders, conversion rate, and commission context can be tied back to the promoter where tracking data exists.',
    },
    {
      question: 'How does MarketSpase reduce waste?',
      answer: 'Budget controls, wallet guards, click analytics, fraud signals, and promoter quality history help reduce duplicate or suspicious activity before it drains campaign spend.',
    },
    {
      question: 'Can I promote store products?',
      answer: 'Yes. Storefront products can be promoted through referral links, giving marketers visibility into product views, buyer activity, and promoter-driven sales.',
    },
  ];

  protected readonly activeUseCase = computed(() => this.useCases()[this.activeUseCaseIndex()] ?? this.useCases()[0]);

  protected openFeature(feature: Feature | MobileFeature): void {
    this.selectedFeature.set(feature);
    this.activeSheet.set('feature');
  }

  protected openUseCase(useCase: UseCase): void {
    this.selectedUseCase.set(useCase);
    this.activeSheet.set('use-case');
  }

  protected openProcess(step: ProcessStep): void {
    this.selectedStep.set(step);
    this.activeSheet.set('process');
  }

  protected openPricing(tier: PricingTier): void {
    this.selectedPricing.set(tier);
    this.activeSheet.set('pricing');
  }

  protected openTestimonial(testimonial: Testimonial): void {
    this.selectedTestimonial.set(testimonial);
    this.activeSheet.set('testimonial');
  }

  protected openFaq(faq: FaqItem): void {
    this.selectedFaq.set(faq);
    this.activeSheet.set('faq');
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
    this.selectedFeature.set(null);
    this.selectedUseCase.set(null);
    this.selectedStep.set(null);
    this.selectedPricing.set(null);
    this.selectedTestimonial.set(null);
    this.selectedFaq.set(null);
  }

  protected featureBullets(feature: Feature | MobileFeature): string[] {
    return 'benefits' in feature ? feature.benefits : feature.bullets;
  }

  protected tone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-purple', 'tone-orange'][index % 4];
  }
}
