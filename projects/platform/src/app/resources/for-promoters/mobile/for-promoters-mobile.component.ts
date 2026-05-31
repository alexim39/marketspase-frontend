import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FooterComponent } from '../../core/footer/footer.component';
import { HeaderComponent } from '../../core/header/header.component';
import { ForPromotersComponent } from '../for-promoters.component';

type PromoterSheet = 'benefit' | 'step' | 'opportunity' | 'quality' | 'proof' | 'faq' | null;

interface MobileBenefit {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
}

interface PromoterStep {
  number: string;
  icon: string;
  title: string;
  description: string;
  details: string[];
}

interface OpportunityCard {
  type: string;
  title: string;
  description: string;
  payout: string;
  metric: string;
  risk: 'low' | 'medium' | 'high';
}

interface QualityRule {
  icon: string;
  title: string;
  description: string;
  tone: 'good' | 'warn' | 'bad';
}

interface ProofStory {
  name: string;
  role: string;
  content: string;
  stats: { metric: string; value: string }[];
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-for-promoters-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './for-promoters-mobile.component.html',
  styleUrls: ['./for-promoters-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForPromotersMobileComponent extends ForPromotersComponent {
  protected readonly activeSheet = signal<PromoterSheet>(null);
  protected readonly selectedBenefit = signal<MobileBenefit | null>(null);
  protected readonly selectedStep = signal<PromoterStep | null>(null);
  protected readonly selectedOpportunity = signal<OpportunityCard | null>(null);
  protected readonly selectedQuality = signal<QualityRule | null>(null);
  protected readonly selectedProof = signal<ProofStory | null>(null);
  protected readonly selectedFaq = signal<FaqItem | null>(null);

  protected readonly heroStats = [
    { icon: 'link', value: 'Unique', label: 'Tracked promoter links' },
    { icon: 'ads_click', value: 'Valid', label: 'Clicks and conversions' },
    { icon: 'shield', value: 'Health', label: 'Fraud-aware rating' },
    { icon: 'account_balance_wallet', value: 'Wallet', label: 'Earnings and payouts' },
  ];

  protected readonly mobileBenefits: MobileBenefit[] = [
    {
      icon: 'link',
      title: 'Promote with unique links',
      description: 'Each accepted campaign or product gives you a link that attributes clicks and sales to you.',
      bullets: ['Campaign links', 'Product referral links', 'Promoter-level tracking'],
    },
    {
      icon: 'image',
      title: 'Use ready ad assets',
      description: 'Use MarketSpase ad assets, captions, and links as separate blocks so posts fit each social platform.',
      bullets: ['Visual asset first', 'Copy-ready caption', 'Paste your unique link'],
    },
    {
      icon: 'query_stats',
      title: 'Watch your performance',
      description: 'Track clicks, conversions, earnings, order activity, and release status inside your dashboard.',
      bullets: ['Promotion analytics', 'Store product analytics', 'Wallet visibility'],
    },
    {
      icon: 'gpp_good',
      title: 'Protect account health',
      description: 'Suspicious clicks, repeated abuse, or low-quality activity can reduce earnings and campaign access.',
      bullets: ['Avoid self-clicking', 'Share with real audiences', 'Keep your account trustworthy'],
    },
  ];

  protected readonly processSteps: PromoterStep[] = [
    {
      number: '01',
      icon: 'verified_user',
      title: 'Verify your profile',
      description: 'Set up your promoter profile, payout details, and account trust basics before promoting.',
      details: ['Complete profile data', 'Use real contact information', 'Keep payout details current'],
    },
    {
      number: '02',
      icon: 'campaign',
      title: 'Choose a promotion',
      description: 'Pick available campaigns or storefront products that fit your audience and niche.',
      details: ['Review marketer/store details', 'Check payout and rules', 'Only pick offers you can promote well'],
    },
    {
      number: '03',
      icon: 'auto_awesome',
      title: 'Prepare the post',
      description: 'Use the ad builder or provided assets, then keep the visual asset, caption, and link separate.',
      details: ['Save clean visual assets', 'Copy caption text', 'Paste your unique tracked link'],
    },
    {
      number: '04',
      icon: 'share',
      title: 'Share responsibly',
      description: 'Post to WhatsApp, Instagram, Facebook, TikTok, X, or your audience channels without spam.',
      details: ['Target real interested people', 'Do not self-click', 'Do not use bots or fake traffic'],
    },
    {
      number: '05',
      icon: 'payments',
      title: 'Track earnings',
      description: 'Monitor clicks, conversions, wallet activity, penalties, and release requests from your dashboard.',
      details: ['Follow link health', 'Watch account health', 'Request payout when available'],
    },
  ];

  protected readonly opportunities: OpportunityCard[] = [
    {
      type: 'Campaign',
      title: 'PPC campaign promotion',
      description: 'Share a campaign link and earn from valid campaign activity under the marketer budget rules.',
      payout: 'Campaign-based',
      metric: 'Clicks and conversions',
      risk: 'medium',
    },
    {
      type: 'Storefront',
      title: 'Product referral promotion',
      description: 'Promote storefront products and help marketers see which promoters drive product interest and sales.',
      payout: 'Commission-aware',
      metric: 'Product clicks and orders',
      risk: 'low',
    },
    {
      type: 'Social',
      title: 'Platform-ready ad posts',
      description: 'Use assets and captions that fit social platform posting rules while keeping tracking links separate.',
      payout: 'Performance-led',
      metric: 'Referral quality',
      risk: 'low',
    },
  ];

  protected readonly qualityRules: QualityRule[] = [
    {
      icon: 'thumb_up',
      title: 'Real audience traffic',
      description: 'Promote to people who may genuinely care about the campaign or product.',
      tone: 'good',
    },
    {
      icon: 'report',
      title: 'Avoid duplicate/self clicks',
      description: 'Repeated clicks from the same person, device, or suspicious location can damage your rating.',
      tone: 'warn',
    },
    {
      icon: 'block',
      title: 'No fake traffic',
      description: 'Bots, click farms, misleading links, and abuse can lead to bans, suspensions, and lower earnings.',
      tone: 'bad',
    },
  ];

  protected readonly proofStories: ProofStory[] = [
    {
      name: 'Aisha Mohammed',
      role: 'Student promoter',
      content: 'I focus on campaigns my classmates actually care about, so my clicks are more trusted and my account stays healthy.',
      stats: [
        { metric: 'Campaigns', value: '42' },
        { metric: 'Success rate', value: '98%' },
      ],
    },
    {
      name: 'Chinedu Okoro',
      role: 'Entrepreneur',
      content: 'Product promotion works best for me because I can connect buyers with products and track results through my links.',
      stats: [
        { metric: 'Products', value: '31' },
        { metric: 'Repeat buyers', value: 'High' },
      ],
    },
    {
      name: 'Aliu Ibrahim',
      role: 'Freelancer',
      content: 'I treat each link like a business asset. Clean posts, real audiences, and no shortcut traffic.',
      stats: [
        { metric: 'Quality score', value: 'Good' },
        { metric: 'Payout flow', value: 'Stable' },
      ],
    },
  ];

  protected readonly faqs: FaqItem[] = [
    {
      question: 'What do promoters share now?',
      answer: 'Promoters share clean campaign or product content with their unique tracked link. The link is what connects valid clicks, conversions, and sales back to the promoter.',
    },
    {
      question: 'Can I promote store products?',
      answer: 'Yes. Storefront product links can attribute product clicks and orders to the promoter when the product promotion flow supports it.',
    },
    {
      question: 'What can reduce my earnings?',
      answer: 'Fraud flags, suspicious duplicate clicks, low-quality traffic, bans, suspensions, and repeated account-health problems can reduce your rating, payouts, and campaign access.',
    },
    {
      question: 'Do I need technical skills?',
      answer: 'No. The platform provides assets, captions, links, and analytics so you can focus on choosing good offers and sharing them with a real audience.',
    },
  ];

  protected openBenefit(benefit: MobileBenefit): void {
    this.selectedBenefit.set(benefit);
    this.activeSheet.set('benefit');
  }

  protected openStep(step: PromoterStep): void {
    this.selectedStep.set(step);
    this.activeSheet.set('step');
  }

  protected openOpportunity(opportunity: OpportunityCard): void {
    this.selectedOpportunity.set(opportunity);
    this.activeSheet.set('opportunity');
  }

  protected openQuality(rule: QualityRule): void {
    this.selectedQuality.set(rule);
    this.activeSheet.set('quality');
  }

  protected openProof(story: ProofStory): void {
    this.selectedProof.set(story);
    this.activeSheet.set('proof');
  }

  protected openFaq(faq: FaqItem): void {
    this.selectedFaq.set(faq);
    this.activeSheet.set('faq');
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
    this.selectedBenefit.set(null);
    this.selectedStep.set(null);
    this.selectedOpportunity.set(null);
    this.selectedQuality.set(null);
    this.selectedProof.set(null);
    this.selectedFaq.set(null);
  }

  protected tone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-purple', 'tone-orange'][index % 4];
  }
}
