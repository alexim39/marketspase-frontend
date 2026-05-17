import { Component, inject, OnInit, computed, AfterViewInit, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, take } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { UserService } from '../../common/services/user.service';
import { DashboardService } from '../../dashboard/dashboard.service';

// Import child components
import { HeroComponent } from './hero/hero.component';
import { QuickStatsComponent } from './quick-stats/quick-stats.component';
import { RoleSwitcherComponent } from '../../common/components/role-switcher/role-switcher.component';
import { CountdownOverlayComponent } from '../../common/components/countdown-overlay/countdown-overlay.component';
import { OnboardingStepsComponent } from './onboarding-steps/onboarding-steps.component';
import { ProofGuideComponent } from './proof-guide/proof-guide.component';
import { VideoGuidesComponent } from './video-guides/video-guides.component';
import { FaqSectionComponent } from './faq-section/faq-section.component';
import { CtaSectionComponent } from './cta-section/cta-section.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  action?: string;
  actionLink?: string;
  completed: boolean;
}

@Component({
  selector: 'marketspase-get-started',
  standalone: true,
  providers: [DashboardService],
  imports: [
    CommonModule,
    HeroComponent,
    QuickStatsComponent,
    RoleSwitcherComponent,
    CountdownOverlayComponent,
    OnboardingStepsComponent,
    ProofGuideComponent,
    VideoGuidesComponent,
    FaqSectionComponent,
    CtaSectionComponent,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './get-started.component.html',
  styleUrls: ['./get-started.component.scss']
})
export class GetStartedComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService);
  private dashboardService = inject(DashboardService);
  private destroyRef = inject(DestroyRef);

  // User signal from service
  user = this.userService.user;

  // Video URLs (sanitized)
  marketerVideoUrl: SafeResourceUrl;
  promoterVideoUrl: SafeResourceUrl;

  // Responsive signal
  isMobile = signal(false);

  // Onboarding progress
  onboardingProgress = signal(0);

  // Step signals
  marketerSteps = signal<OnboardingStep[]>([]);
  promoterSteps = signal<OnboardingStep[]>([]);

  // Role switch state
  currentCountdown = signal<number | null>(null);
  isSwitchingRole = signal(false);

  // Computed role flags
  userRole = computed(() => this.user()?.role || '');
  isMarketer = computed(() => ['marketer', 'admin'].includes(this.userRole()));
  isPromoter = computed(() => ['promoter', 'admin'].includes(this.userRole()));
  isOnboardingComplete = computed(() => this.onboardingProgress() === 100);

  // Quick stats data
  quickStats = signal([
    { label: 'Active Marketers', value: '1,250+', icon: 'storefront', color: 'primary' },
    { label: 'Active Promoters', value: '10,000+', icon: 'groups', color: 'accent' },
    { label: 'Total Payouts', value: '₦10M+', icon: 'currency_exchange', color: 'warn' },
    { label: 'Campaigns Shared', value: '200K+', icon: 'trending_up', color: 'success' }
  ]);

  // FAQ items with role targeting
    faqItems = signal([
    {
        question: 'How do I get paid as a promoter?',
        answer: 'You earn from valid performance on your accepted promotions. Share the MarketSpase tracked link from your Promotions dashboard, and your earnings build from valid billable clicks recorded on that promotion.',
        target: 'promoter'
    },
    {
        question: 'What leads to campaign rejection?',
        answer: `A promotion may be rejected if you replace the MarketSpase tracking link, remove the UPI or required caption details, use the wrong media, or ignore campaign-specific instructions. Suspicious, fake, repeated, or manipulated traffic can also lead to rejection or account sanctions. If a campaign requests extra proof, follow the instructions shown on that promotion before submitting.`,
        target: 'promoter'
    },
    {
        question: 'How are clicks tracked and verified on MarketSpase?',
        answer: `Each accepted promotion comes with a unique tracking link and UPI. MarketSpase uses that link, campaign-side attribution, and platform quality checks to separate valid billable clicks from invalid or suspicious activity, so promoters and marketers both work from trusted performance data.`,
        target: 'promoter'
    },
    {
        question: 'Can I be both a marketer and promoter?',
        answer: `Yes! Many users manage their business campaigns on MarketSpase while earning extra income by promoting other businesses through their tracked campaign links.`,
        target: 'both'
    },
    {
        question: 'Can I own multiple accounts on MarketSpase?',
        answer: `No. Each user is allowed to have only one MarketSpase account. Creating or operating multiple accounts is strictly against our policy. 
        Once detected by our AI system (Martha), all related accounts will be suspended indefinitely without prior notice. 
        You can, however, use a single account to both run campaigns as a marketer and earn as a promoter.`,
        target: 'both'
    },
        {
        target: 'both',
        question: 'How does MarketSpase work?',
        answer: 'MarketSpase is a marketing platform that helps businesses run campaigns through real people and trusted social sharing. Marketers create campaigns, and verified promoters accept them, share them with their unique tracked links, and earn from valid campaign performance.'
        },

    {
        target: 'marketer',
        question: 'How much do I need to deposit to get started?',
        answer: 'You can start advertising on MarketSpase with a small budget, minimum deposit is N1000. There is no fixed amount needed — you fund your wallet based on how many promoters you want to promote your business. This makes MarketSpase affordable for small businesses, startups, and growing brands.'
    },
    {
        target: 'marketer',
        question: 'How does MarketSpase help my business?',
        answer: 'MarketSpase helps your business reach real people through trusted social sharing, direct conversations, and promoter networks. Your campaigns are shared by real users using tracked promotion links, which can increase visibility, enquiries, clicks, and sales opportunities.'
    },
    {
        target: 'marketer',
        question: 'How Does MarketSpase advertise my business?',
        answer: 'Your campaign is distributed by promoters whose audiences match the type of attention you want. They share your approved media and tracked link across WhatsApp and other supported social surfaces, helping your business reach diverse and organic audiences.'
    },
    {
        target: 'marketer',
        question: 'What kind of businesses can advertise on MarketSpase?',
        answer: 'MarketSpase supports all range of businesses including schools, online vendors, products and service providers, event organizers, real estate, churches, political campaigns, creatives, and startups—as long as the campaign follows platform policies.'
    },
    {
        target: 'marketer',
        question: 'Can I control how much I spend?',
        answer: 'Yes. You decide your budget, the number of promoters you want, and when to stop or pause your campaign. This gives you full control over your advertising spend.'
    },
    {
        target: 'marketer',
        question: 'How fast will my campaign start running?',
        answer: 'Once your campaign is approved, promoters can start accepting and sharing it almost immediately, allowing your tracked promotion traffic to start within minutes.'
    },
    {
        target: 'marketer',
        question: 'What happens if a promotion is rejected?',
        answer: 'If an ad is rejected due to promoter errors or rule violations, you are not charged for it as the fund will be returned back to your wallet to enable another promoter re-promote the ad. This ensures your money is only spent on valid and properly executed promotions.'
    },
    {
        target: 'marketer',
        question: 'Can I track my campaign performance?',
        answer: 'Yes. Your dashboard shows campaign progress, tracked clicks, billable clicks, spending, promotion status, and transaction history so you can clearly see performance and value.'
    },
    {
        target: 'marketer',
        question: 'Do I need technical skills to use MarketSpase?',
        answer: 'No. MarketSpase is designed to be simple and beginner-friendly. You can create and manage campaigns easily without any technical knowledge.'
    },
    {
        target: 'marketer',
        question: 'What kind of contents can i advertise on MarketSpase?',
        answer: 'You can advertise links, images, flyers, videos, and other approved promotional content as long as they meet MarketSpase content guidelines.'
    },
    {
        target: 'marketer',
        question: 'Is my money safe on MarketSpase?',
        answer: 'Yes. MarketSpase uses secure payment systems and only releases funds for verified promotions, protecting your advertising budget.'
    }
    ]);

  // FAQ categories and active category
  faqCategories = signal([
    { id: 'all', label: 'All Questions', icon: 'all_inclusive' },
    { id: 'marketer', label: 'For Marketers', icon: 'storefront' },
    { id: 'promoter', label: 'For Promoters', icon: 'groups' },
    { id: 'general', label: 'General', icon: 'help' }
  ]);
  activeFaqCategory = signal('all');

  // Filtered FAQs based on role and category
  filteredFaqItems = computed(() => {
    const userRole = this.user()?.role || '';
    const userTarget = userRole === 'marketer' || userRole === 'promoter' ? userRole : 'both';
    return this.faqItems().filter(faq => {
      if (faq.target === 'both') return true;
      if (!userRole) return faq.target === 'marketer' || faq.target === 'promoter';
      if (userRole === 'admin') return true;
      return faq.target === userTarget;
    });
  });

  categorizedFaqItems = computed(() => {
    const category = this.activeFaqCategory();
    if (category === 'all') return this.filteredFaqItems();
    if (category === 'general') return this.faqItems().filter(faq => faq.target === 'both');
    if (category === 'marketer' || category === 'promoter') return this.faqItems().filter(faq => faq.target === category);
    return this.filteredFaqItems();
  });

  private resizeListener = () => this.checkScreenSize();

  readonly fbUrlMarketer = 'https://web.facebook.com/reel/4109263909219907';
  readonly fbUrlPromoter = 'https://web.facebook.com/reel/1122807266576576';

  constructor() {
    const marketerPlugin = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(this.fbUrlMarketer)}&show_text=0&autoplay=1`;
    this.marketerVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(marketerPlugin);

    const promoterPlugin = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(this.fbUrlPromoter)}&show_text=0&autoplay=1`;
    this.promoterVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(promoterPlugin);

    this.initializeSteps();
  }

  ngOnInit(): void {
    this.checkScreenSize();
    window.addEventListener('resize', this.resizeListener);
    setTimeout(() => this.updateOnboardingProgress(), 0);
    setTimeout(() => {
      const role = this.user()?.role;
      if (role === 'marketer') this.activeFaqCategory.set('marketer');
      else if (role === 'promoter') this.activeFaqCategory.set('promoter');
      else this.activeFaqCategory.set('all');
    }, 100);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.updateOnboardingProgress(), 100);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
  }

  private initializeSteps(): void {
    this.marketerSteps.set([
      {
        id: 1,
        title: 'Complete Your Profile',
        description: 'Add your basic profile details to verify your identity.',
        icon: 'person',
        action: 'Go to Profile',
        actionLink: '/dashboard/settings/account',
        completed: false
      },
      {
        id: 2,
        title: 'Add Funds to Wallet',
        description: 'To start running campaigns, deposit money into your account. This balance funds your ads, and a 10% service charge applies, no hidden charges.',
        icon: 'account_balance_wallet',
        action: 'Add Funds',
        completed: false
      },
      {
        id: 3,
        title: 'Create Your First Campaign',
        description: 'To launch a WhatsApp ad. Simply upload your content (image or video), set your budget, and target your audience. Each ad is automatically watermarked.',
        icon: 'campaign',
        action: 'Create Campaign',
        actionLink: '/dashboard/campaigns/create',
        completed: false
      },
      {
        id: 4,
        title: 'Track Performance Live',
        description: 'Monitor tracked clicks, billable clicks, campaign spend, and promotion progress from your dashboard in real time.',
        icon: 'analytics',
        action: 'View Dashboard',
        actionLink: '/dashboard/campaigns',
        completed: false
      }
    ]);

    this.promoterSteps.set([
      {
        id: 1,
        title: 'Complete Your Profile',
        description: 'Add your basic profile details to verify your identity.',
        icon: 'person',
        action: 'Go to Profile',
        actionLink: '/dashboard/settings/account',
        completed: false
      },
      {
        id: 2,
        title: 'Get Verified as a Promoter',
        description: 'Complete promoter verification so you can accept campaigns, receive your unique UPI, and access tracked promotion links.',
        icon: 'verified_user',
        action: 'Open Verification',
        actionLink: '/dashboard/settings/account',
        completed: false
      },
      // {
      //   id: 3,
      //   title: 'Add Your Payout Account',
      //   description: 'Set up the account details you want to use for withdrawals so your earnings can move smoothly once promotions begin performing.',
      //   icon: 'account_balance_wallet',
      //   action: 'Add Payout Details',
      //   actionLink: '/dashboard/settings/account',
      //   completed: false
      // },
      {
        id: 3,
        title: 'Accept a Campaign and Prepare the Promotion',
        description: 'Browse available campaigns, accept the ones that fit your audience, then open Dashboard > Campaigns > Promotions to download the media, copy the caption, and copy your MarketSpase tracking link.',
        icon: 'campaign',
        action: 'Browse Campaigns',
        actionLink: '/dashboard/campaigns',
        completed: false
      },
      {
        id: 4,
        title: 'Share the Tracked Link and Monitor Results',
        description: 'Share only the generated MarketSpase link, keep the UPI and campaign details intact, and use the Promotions page to monitor tracked clicks, billable clicks, status, and earnings. Follow any extra proof instructions shown on the promotion when required.',
        icon: 'insights',
        action: 'Open Promotions',
        actionLink: '/dashboard/campaigns/promotions',
        completed: false
      }
    ]);
  }

  private checkScreenSize(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  private updateOnboardingProgress(): void {
    const user = this.user();
    if (!user) {
      this.onboardingProgress.set(0);
      return;
    }

    const profileComplete = !!user.personalInfo?.phone && !!user.personalInfo?.address?.street;
    const walletFunded = (user.wallets?.marketer?.balance || 0) > 0 || (user.wallets?.promoter?.balance || 0) > 0;
    const hasCampaigns = (user.campaigns?.length || 0) > 0;
    const isVerified = user.verified || false;
    const payoutSet = (user.savedAccounts?.length || 0) > 0;
    const hasSharedCampaigns = (user.promotion?.length || 0) > 0;

    let completedSteps = 0;
    let totalSteps = 0;

    if (user.role === 'marketer') {
      const updatedMarketerSteps = this.marketerSteps().map((step, index) => ({
        ...step,
        completed: index === 0 ? profileComplete : index === 1 ? walletFunded : hasCampaigns
      }));
      if (JSON.stringify(this.marketerSteps()) !== JSON.stringify(updatedMarketerSteps)) {
        this.marketerSteps.set(updatedMarketerSteps);
      }
      completedSteps = updatedMarketerSteps.filter(s => s.completed).length;
      totalSteps = updatedMarketerSteps.length;
    } else if (user.role === 'promoter') {
      const updatedPromoterSteps = this.promoterSteps().map((step, index) => ({
        ...step,
        completed: index === 0 ? profileComplete : index === 1 ? isVerified : index === 2 ? payoutSet : hasSharedCampaigns
      }));
      if (JSON.stringify(this.promoterSteps()) !== JSON.stringify(updatedPromoterSteps)) {
        this.promoterSteps.set(updatedPromoterSteps);
      }
      completedSteps = updatedPromoterSteps.filter(s => s.completed).length;
      totalSteps = updatedPromoterSteps.length;
    } else if (user.role === 'admin') {
      const marketerCompleted = this.marketerSteps().filter(s => s.completed).length;
      const promoterCompleted = this.promoterSteps().filter(s => s.completed).length;
      const totalMarketerSteps = this.marketerSteps().length;
      const totalPromoterSteps = this.promoterSteps().length;
      const marketerProgress = marketerCompleted / totalMarketerSteps;
      const promoterProgress = promoterCompleted / totalPromoterSteps;
      this.onboardingProgress.set(Math.round(((marketerProgress + promoterProgress) / 2) * 100));
      return;
    } else {
      this.onboardingProgress.set(0);
      return;
    }

    const newProgress = Math.round((completedSteps / totalSteps) * 100);
    if (this.onboardingProgress() !== newProgress) {
      this.onboardingProgress.set(newProgress);
    }
  }

  // Role switching
  switchRole(role: 'marketer' | 'promoter'): void {
    if (this.isSwitchingRole()) return;
    this.isSwitchingRole.set(true);
    const roleObject = { role, userId: this.user()?._id };
    this.dashboardService.switchUser(roleObject)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.currentCountdown.set(5);
            this.startCountdown(5);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.isSwitchingRole.set(false);
          this.snackBar.open(error.error?.message || 'Server error', 'Ok', { duration: 3000, panelClass: 'snackbar-error' });
        }
      });
  }

  private startCountdown(seconds: number): void {
    interval(1000).pipe(take(seconds), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (count) => {
        const remaining = seconds - count - 1;
        this.currentCountdown.set(remaining);
        if (remaining === 0) setTimeout(() => window.location.reload(), 500);
      },
      complete: () => {
        this.currentCountdown.set(null);
        this.isSwitchingRole.set(false);
      }
    });
  }

  cancelCountdown(): void {
    this.currentCountdown.set(null);
    this.isSwitchingRole.set(false);
    this.snackBar.open('Role switch cancelled.', 'Ok', { duration: 2000, panelClass: 'snackbar-info' });
  }

  reloadPage(): void {
    window.location.reload();
  }

  // Step navigation
  navigateToStep(step: OnboardingStep): void {
    if (step.actionLink) this.router.navigate([step.actionLink]);
  }

  // Scroll to video guides
  scrollToVideoGuides(): void {
    document.getElementById('video-guides')?.scrollIntoView({ behavior: 'smooth' });
  }

  // Track functions (used in templates)
  trackByStepId = (index: number, step: OnboardingStep) => step.id;
  trackByStatLabel = (index: number, stat: any) => stat.label;
  trackByFaqQuestion = (index: number, faq: any) => faq.question;

  // Get current role display name
  getCurrentRoleDisplay(): string {
    const role = this.userRole();
    return role === 'marketer' ? 'Marketer' : role === 'promoter' ? 'Promoter' : role === 'admin' ? 'Administrator' : 'User';
  }

  // Get steps for current role (used by child)
  getCurrentSteps() {
    if (this.isMarketer()) return this.marketerSteps();
    if (this.isPromoter()) return this.promoterSteps();
    return [];
  }
}
