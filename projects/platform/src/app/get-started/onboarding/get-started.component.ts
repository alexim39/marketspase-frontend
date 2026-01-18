import { Component, inject, OnInit, computed, AfterViewInit, OnDestroy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { signal } from '@angular/core';

import { UserService } from '../../common/services/user.service';
import { DashboardService } from '../../dashboard/dashboard.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { interval, take } from 'rxjs';
import { ProofGuideService } from './proof-model/proof-guide.service';

interface OnboardingStep {
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
  providers: [ProofGuideService],
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule,
    MatBadgeModule,
    MatChipsModule
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
  private proofGuideService = inject(ProofGuideService);
  private readonly destroyRef = inject(DestroyRef);
  // User signal from service
  user = this.userService.user;
  
  // Video URLs
  marketerVideoUrl: SafeResourceUrl;
  promoterVideoUrl: SafeResourceUrl;
  
  // Responsive signals
  isMobile = signal(false);
  
  // Onboarding progress signals - initialize with 0
  onboardingProgress = signal(0);
  
  // Step signals with default values
  marketerSteps = signal<OnboardingStep[]>([]);
  promoterSteps = signal<OnboardingStep[]>([]);

  countdownTimer = signal<number | null>(null);
  isSwitchingRole = signal(false);
  currentCountdown = signal<number | null>(null);
  
  // **FIXED: Computed properties with proper dependencies**
  // Determine user role based on user data
  userRole = computed(() => this.user()?.role || '');
  
  isMarketer = computed(() => {
    const role = this.userRole();
    return role === 'marketer' || role === 'admin';
  });
  
  isPromoter = computed(() => {
    const role = this.userRole();
    return role === 'promoter' || role === 'admin';
  });
  
  // Check if user has completed all steps - depends only on onboardingProgress
  isOnboardingComplete = computed(() => this.onboardingProgress() === 100);
  
  // Quick stats for motivation
  quickStats = signal([
    { label: 'Active Marketers', value: '1,250+', icon: 'storefront', color: 'primary' },
    { label: 'Active Promoters', value: '15,000+', icon: 'groups', color: 'accent' },
    { label: 'Total Earnings', value: '₦25M+', icon: 'currency_exchange', color: 'warn' },
    { label: 'Campaigns Shared', value: '500K+', icon: 'trending_up', color: 'success' }
  ]);
  
  // FAQ items with role targeting
    faqItems = signal([
    {
        question: 'How do I get paid as a promoter?',
        answer: 'You earn money for every verified promotion posted on your WhatsApp status. Payments are processed automatically to your wallet after validation.',
        target: 'promoter'
    },
    {
        question: 'What leads to campaign rejection?',
        answer: `A promotion may be rejected if the required proof is incomplete or unclear, if the promotion is not posted to WhatsApp within 15 minutes of download, or if submitted details (such as view count or promotion ID) do not match the proof provided. 
        Promotions will also be rejected if the uploaded image is unrecognized, fake, edited, AI-generated, or suspicious. 
        Additionally, removing a promotion from WhatsApp status early—even after reaching the minimum view requirement—is not allowed and can lead to rejection or account sanctions.`,
        target: 'promoter'
    },
    {
        question: 'How are views verified on MarketSpase?',
        answer: `MarketSpase uses unique tracking ID combined with AI-powered verification (Martha) to track and validate views. 
        This system filters out fake, repeated, AI-generated or manipulated views and ensures that only genuine human recorded/screenshoted views are counted toward campaign performance and promoter earnings.`,
        target: 'promoter'
    },
    {
        question: 'Can I be both a marketer and promoter?',
        answer: `Yes! Many users manage their business campaigns on MarketSpase while earning extra income by promoting other business on their WhatsApp status.`,
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
        answer: 'MarketSpase is a marketing platform that uses a micro-influencer model to advertise businesses through real people on WhatsApp Status. Businesses create campaigns, and verified users (called promoters) post these ads on their WhatsApp Status to reach real, engaged audiences.'
        },

    {
        target: 'marketer',
        question: 'How much do I need to deposit to get started?',
        answer: 'You can start advertising on MarketSpase with a small budget, minimum deposit is N1000. There is no fixed amount needed — you fund your wallet based on how many promoters you want to promote your business. This makes MarketSpase affordable for small businesses, startups, and growing brands.'
    },
    {
        target: 'marketer',
        question: 'How does MarketSpase help my business?',
        answer: 'MarketSpase helps your business reach real people directly through WhatsApp, which is more personal and trusted than traditional ads. Your ads appears on multiple WhatsApp statuses, increasing visibility, engagement, inquiries, and potential sales.'
    },
    {
        target: 'marketer',
        question: 'How Does MarketSpase advertise my business?',
        answer: 'Your ad is seen by WhatsApp users across different locations and interest groups, depending on the promoters who pick up your campaign to post on their status. This allows your business to reach diverse and organic audiences.'
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
        answer: 'Once your campaign is approved, promoters can start picking it up almost immediately to post on their WhatsApp statuses, allowing your ad to go live within minutes.'
    },
    {
        target: 'marketer',
        question: 'What happens if a promotion is rejected?',
        answer: 'If an ad is rejected due to promoter errors or rule violations, you are not charged for it as the fund will be returned back to your wallet to enable another promoter re-promote the ad. This ensures your money is only spent on valid and properly executed promotions.'
    },
    {
        target: 'marketer',
        question: 'Can I track my campaign performance?',
        answer: 'Yes. Your dashboard shows campaign progress, verified views, spending, and transaction history—so you can clearly see the value you\'re getting.'
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

  // Add method to open proof guide
  openProofGuide(): void {
    this.proofGuideService.openProofGuide();
  }

  // Computed property to filter FAQs based on user role
  filteredFaqItems = computed(() => {
    const userRole = this.user()?.role || '';
    const userTarget = userRole === 'marketer' || userRole === 'promoter' ? userRole : 'both';
    
    return this.faqItems().filter(faq => {
      // If target is 'both', show to everyone
      if (faq.target === 'both') return true;
      
      // If user has no specific role, show both marketer and promoter FAQs
      if (!userRole || userRole === 'user') {
        return faq.target === 'marketer' || faq.target === 'promoter';
      }
      
      // If user is admin, show all FAQs
      if (userRole === 'admin') return true;
      
      // Show FAQs matching user's role
      return faq.target === userTarget;
    });
  });

// Add a method to get role-specific FAQs with tabs
faqCategories = signal([
  { id: 'all', label: 'All Questions', icon: 'all_inclusive' },
  { id: 'marketer', label: 'For Marketers', icon: 'storefront' },
  { id: 'promoter', label: 'For Promoters', icon: 'groups' },
  { id: 'general', label: 'General', icon: 'help' }
]);

// Active FAQ category
activeFaqCategory = signal('all');

// Filtered FAQs based on selected category
categorizedFaqItems = computed(() => {
  const category = this.activeFaqCategory();
  const userRole = this.user()?.role || '';
  
  if (category === 'all') {
    return this.filteredFaqItems();
  } else if (category === 'general') {
    return this.faqItems().filter(faq => faq.target === 'both');
  } else if (category === 'marketer' || category === 'promoter') {
    return this.faqItems().filter(faq => faq.target === category);
  }
  
  return this.filteredFaqItems();
});
  
  // Track resize listener for cleanup
  private resizeListener = () => this.checkScreenSize();

   readonly fbUrlMarketer = 'https://web.facebook.com/reel/4109263909219907';
    marketerPosterUrl = 'img/placeholders/how-to-video.jpg'; // replace with proper poster image

    readonly fbUrlPromoter = 'https://web.facebook.com/reel/1122807266576576';
    promoterPosterUrl = 'img/placeholders/how-to-video.jpg'; // replace with proper poster image

  
  constructor() {

    const marketerPlugin = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(this.fbUrlMarketer)}&show_text=0&autoplay=1`;
    this.marketerVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(marketerPlugin);

    const promoterPlugin = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(this.fbUrlPromoter)}&show_text=0&autoplay=1`;
    this.promoterVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(promoterPlugin);

    // Initialize steps
    this.initializeSteps();
  }
  
  ngOnInit(): void {
    // Check screen size for responsive design
    this.checkScreenSize();
    window.addEventListener('resize', this.resizeListener);
    
    // Set up effect to update progress when user changes
    // Use setTimeout to avoid running during change detection
    setTimeout(() => {
      this.updateOnboardingProgress();
    }, 0);

     // Set default FAQ category based on user role
    setTimeout(() => {
        const userRole = this.user()?.role;
        if (userRole === 'marketer') {
        this.activeFaqCategory.set('marketer');
        } else if (userRole === 'promoter') {
        this.activeFaqCategory.set('promoter');
        } else {
        this.activeFaqCategory.set('all');
        }
    }, 100);

  }
  
  ngAfterViewInit(): void {
    // Update progress after view initialization
    setTimeout(() => {
      this.updateOnboardingProgress();
    }, 100);
  }
  
  ngOnDestroy(): void {
    // Clean up resize listener
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
        //actionLink: '/dashboard/settings/account',
        completed: false
      },
      {
        id: 2,
        title: 'Add Funds to Wallet',
        description: 'To start running campaigns, deposit money into your account. This balance funds your ads, and a 10% service charge applies, no hidden charges.',
        icon: 'account_balance_wallet',
        action: 'Add Funds',
        //actionLink: '/dashboard/wallet',
        completed: false
      },
      {
        id: 3,
        title: 'Create Your First Campaign',
        description: 'To launch a WhatsApp ad. Simply upload your content (image or video), set your budget, and target your audience. Each ad is automatically watermarked.',
        icon: 'campaign',
        action: 'Create Campaign',
        //actionLink: '/dashboard/campaigns/new',
        completed: false
      },
      {
        id: 4,
        title: 'Real-time Performance Tracking',
        description: 'Monitor your campaign performance with live analytics, view counts, and engagement metrics.',
        icon: 'analytics',
        action: 'View Dashboard',
        //actionLink: '/dashboard/analytics',
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
        //actionLink: '/dashboard/profile',
        completed: false
      },
      {
        id: 2,
        title: 'Accept Available Campaigns',
        description: 'Choose from hundreds of promotional campaigns that match your audience. Each campaign shows exactly how much you\'ll earn and the minimum view required.',
        icon: 'verified',
        action: 'Verify Now',
        //actionLink: '/dashboard/verification',
        completed: false
      },
      {
        id: 3,
        title: 'Post on Your WhatsApp Status',
        description: 'Download the ads asset (image, video) and post it to your WhatsApp status. Keep it live for at least 22 hours.',
        icon: 'payments',
        action: 'Add Method',
        //actionLink: '/dashboard/payouts',
        completed: false
      },
      {
        id: 4,
        title: 'Submit Proof',
        description: 'Take a screenshot or screen recording showing the view counts, the timeline, and the provided promotion ID. Submit it on the same page it was downloaded it on MarketSpace.',
        icon: 'share',
        action: 'Browse Campaigns',
        //actionLink: '/dashboard/campaigns',
        completed: false
      },
      {
        id: 5,
        title: 'Get Paid Automatically',
        description: 'Once your proof is validated, they system automatically transfer the earnings to your wallet where you can request withdrawal.',
        icon: 'share',
        action: 'Browse Campaigns',
        //actionLink: '/dashboard/campaigns',
        completed: false
      }
    ]);
  }
  
  private checkScreenSize(): void {
    this.isMobile.set(window.innerWidth < 768);
  }
  
  // **FIXED: Simplified progress update - only update when needed**
  private updateOnboardingProgress(): void {
    const user = this.user();
    if (!user) {
      this.onboardingProgress.set(0);
      return;
    }
    
    // Calculate completion status
    const profileComplete = !!user.personalInfo?.phone && !!user.personalInfo?.address?.street;
    const walletFunded = (user.wallets?.marketer?.balance || 0) > 0 || (user.wallets?.promoter?.balance || 0) > 0;
    const hasCampaigns = (user.campaigns?.length || 0) > 0;
    const isVerified = user.verified || false;
    const payoutSet = (user.savedAccounts?.length || 0) > 0;
    const hasSharedCampaigns = (user.promotion?.length || 0) > 0;
    
    let completedSteps = 0;
    let totalSteps = 0;
    
    if (user.role === 'marketer') {
      // Update marketer steps without triggering unnecessary signal updates
      const marketerSteps = this.marketerSteps();
      const updatedMarketerSteps = marketerSteps.map((step, index) => {
        let completed = false;
        switch (index) {
          case 0: completed = profileComplete; break;
          case 1: completed = walletFunded; break;
          case 2: completed = hasCampaigns; break;
          case 3: completed = hasCampaigns; break;
        }
        return { ...step, completed };
      });
      
      // Only update if changed
      if (JSON.stringify(marketerSteps) !== JSON.stringify(updatedMarketerSteps)) {
        this.marketerSteps.set(updatedMarketerSteps);
      }
      
      completedSteps = updatedMarketerSteps.filter(s => s.completed).length;
      totalSteps = updatedMarketerSteps.length;
      
    } else if (user.role === 'promoter') {
      // Update promoter steps without triggering unnecessary signal updates
      const promoterSteps = this.promoterSteps();
      const updatedPromoterSteps = promoterSteps.map((step, index) => {
        let completed = false;
        switch (index) {
          case 0: completed = profileComplete; break;
          case 1: completed = isVerified; break;
          case 2: completed = payoutSet; break;
          case 3: completed = hasSharedCampaigns; break;
        }
        return { ...step, completed };
      });
      
      // Only update if changed
      if (JSON.stringify(promoterSteps) !== JSON.stringify(updatedPromoterSteps)) {
        this.promoterSteps.set(updatedPromoterSteps);
      }
      
      completedSteps = updatedPromoterSteps.filter(s => s.completed).length;
      totalSteps = updatedPromoterSteps.length;
      
    } else if (user.role === 'admin') {
      // For admin, calculate average progress
      const marketerSteps = this.marketerSteps();
      const promoterSteps = this.promoterSteps();
      
      const marketerCompleted = marketerSteps.filter(s => s.completed).length;
      const promoterCompleted = promoterSteps.filter(s => s.completed).length;
      
      const totalMarketerSteps = marketerSteps.length;
      const totalPromoterSteps = promoterSteps.length;
      
      const marketerProgress = marketerCompleted / totalMarketerSteps;
      const promoterProgress = promoterCompleted / totalPromoterSteps;
      
      this.onboardingProgress.set(Math.round(((marketerProgress + promoterProgress) / 2) * 100));
      return;
    } else {
      this.onboardingProgress.set(0);
      return;
    }
    
    // Only update progress if it changed
    const newProgress = Math.round((completedSteps / totalSteps) * 100);
    if (this.onboardingProgress() !== newProgress) {
      this.onboardingProgress.set(newProgress);
    }
  }
  
  // Navigate to step action
  navigateToStep(step: OnboardingStep): void {
    if (step.actionLink) {
      this.router.navigate([step.actionLink]);
    }
  }
  
  // Mark step as complete (for demo/testing)
  markStepComplete(role: 'marketer' | 'promoter', stepId: number): void {
    if (role === 'marketer') {
      const updatedSteps = this.marketerSteps().map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      );
      this.marketerSteps.set(updatedSteps);
    } else {
      const updatedSteps = this.promoterSteps().map(step => 
        step.id === stepId ? { ...step, completed: true } : step
      );
      this.promoterSteps.set(updatedSteps);
    }
    
    this.updateOnboardingProgress();
    
    this.snackBar.open('Step completed!', 'Dismiss', {
      duration: 2000,
      panelClass: 'snackbar-success'
    });
  }
  
  // Get current role display name
  getCurrentRoleDisplay(): string {
    const role = this.userRole();
    switch (role) {
      case 'marketer': return 'Marketer';
      case 'promoter': return 'Promoter';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  }
  
  // Get appropriate steps based on user role
  getCurrentSteps() {
    const role = this.userRole();
    if (role === 'marketer') {
      return this.marketerSteps();
    } else if (role === 'promoter') {
      return this.promoterSteps();
    } else if (role === 'admin') {
      // Admin sees both? Or you can decide to show marketer steps by default
      return this.marketerSteps();
    }
    return this.marketerSteps(); // Default fallback
  }
  
  // Switch role (for testing/demo)
  switchRole(role: 'marketer' | 'promoter'): void {
    // Prevent multiple simultaneous switches
    if (this.isSwitchingRole()) return;
    
    this.isSwitchingRole.set(true);
    
    const roleObject = {
        role,
        userId: this.user()?._id
    };
    
    this.dashboardService.switchUser(roleObject)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: (response) => {
            if (response.success) {
            // Show success message with countdown
            const countdownDuration = 5; // 5 seconds countdown
            this.currentCountdown.set(countdownDuration);
            
            // this.snackBar.open(
            //     `Role switched to ${role}. Page will reload in ${countdownDuration} seconds...`, 
            //     'Cancel', 
            //     { 
            //     duration: countdownDuration * 1000,
            //     panelClass: ['snackbar-success']
            //     }
            // ).onAction().subscribe(() => {
            //     // User clicked "Cancel" - stop the countdown
            //     this.cancelCountdown();
            // });
            
            // Start countdown timer
            this.startCountdown(countdownDuration);
            }
        },
        error: (error: HttpErrorResponse) => {
            this.isSwitchingRole.set(false);
            let errorMessage = 'Server error occurred, please try again.';
            if (error.error && error.error.message) {
            errorMessage = error.error.message;
            }
            this.snackBar.open(errorMessage, 'Ok', { 
            duration: 3000,
            panelClass: ['snackbar-error']
            });
        }
        });
    }

  private startCountdown(seconds: number): void {
    this.countdownTimer.set(seconds);
    
    interval(1000) // Emit every second
        .pipe(
        take(seconds), // Take only the specified number of seconds
        takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
        next: (count) => {
            const remaining = seconds - count - 1;
            this.currentCountdown.set(remaining);
            
            // Update snackbar message (optional - can be heavy)
            // You could update the snackbar text here if needed
            
            if (remaining === 0) {
            // Countdown finished, reload the page
            setTimeout(() => {
                window.location.reload();
            }, 500); // Small delay for smooth transition
            }
        },
        complete: () => {
            // Clean up
            this.countdownTimer.set(null);
            this.isSwitchingRole.set(false);
        }
        });
    }

  public cancelCountdown(): void {
    // Clear any existing timer
    this.countdownTimer.set(null);
    this.currentCountdown.set(null);
    this.isSwitchingRole.set(false);
    
    // Show cancellation message
    this.snackBar.open('Role switch cancelled. No reload will occur.', 'Ok', {
        duration: 2000,
        panelClass: ['snackbar-info']
    });
    }
  
    reloadPage() {
        window.location.reload();
    }

  // Open video in modal
  openVideoModal(videoType: 'marketer' | 'promoter'): void {
    // Implementation for modal dialog
    // You can create a separate video modal component
  }
  
  // Track by function for performance
  trackByStepId(index: number, step: OnboardingStep): number {
    return step.id;
  }
  
  trackByStatLabel(index: number, stat: any): string {
    return stat.label;
  }
  
  trackByFaqQuestion(index: number, faq: any): string {
    return faq.question;
  }

   // In your component
    scrollToVideoGuides(event?: any) {
        const element = document.getElementById('video-guides');
        if (element) {
            element.scrollIntoView({ 
            behavior: 'smooth',  // Smooth scrolling
            block: 'start',      // Align to top of viewport
            inline: 'nearest'
            });
            
            // Optional: Add visual feedback
            element.classList.add('highlight');
            setTimeout(() => element.classList.remove('highlight'), 1000);
        }
    }


    // Get FAQ count for a specific category
    getFaqCountForCategory(category: string): number {
        if (category === 'general') {
            return this.faqItems().filter(faq => faq.target === 'both').length;
        } else if (category === 'marketer' || category === 'promoter') {
            return this.faqItems().filter(faq => faq.target === category).length;
        }
        return this.faqItems().length;
    }

    // Check if FAQ is relevant to current user
    isRelevantFaq(faq: any): boolean {
        const userRole = this.user()?.role;
        
        if (faq.target === 'both') return true;
        if (!userRole || userRole === 'user') return true; // Show all to new users
        if (userRole === 'admin') return true; // Admin sees all
        
        return faq.target === userRole;
    }

    // Get FAQs for specific role (useful for other components)
    getRoleSpecificFaqs(role: string): any[] {
        return this.faqItems().filter(faq => {
            if (faq.target === 'both') return true;
            if (role === 'admin') return true;
            return faq.target === role;
        });
    }
}