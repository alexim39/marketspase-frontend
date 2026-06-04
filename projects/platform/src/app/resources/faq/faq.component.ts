// faq.component.ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HeaderComponent } from '../core/header/header.component';
import { FooterComponent } from '../core/footer/footer.component';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags?: string[];
  popular?: boolean;
  featured?: boolean;
  lastUpdated?: string;
  readTime?: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  count: number;
  popularQuestions: string[];
}

export interface PopularQuestion {
  question: string;
  category: string;
  views?: number;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FAQComponent {
  private readonly destroyRef = inject(DestroyRef);

  searchControl = new FormControl('');
  activeCategory = signal<string>('getting-started');

  popularSearches = signal<string[]>([
    'How to withdraw earnings',
    'Click quality review',
    'Reset password',
    'Create first campaign',
    'Improve valid click performance',
    'Payment methods',
    'Account verification',
    'Campaign performance'
  ]);

  categories = signal<FAQCategory[]>([
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Learn the basics and set up your MarketSpase account',
      icon: 'rocket_launch',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      count: 25,
      popularQuestions: ['How do I create an account?', 'What are the requirements for promoters?']
    },
    {
      id: 'account-management',
      name: 'Account & Profile',
      description: 'Manage your account settings, profile, and security',
      icon: 'account_circle',
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)',
      count: 18,
      popularQuestions: ['How to reset my password?', 'How to verify my account?']
    },
    {
      id: 'campaigns',
      name: 'Campaigns',
      description: 'Create, manage, and optimize your marketing campaigns',
      icon: 'campaign',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #10888eff 100%)',
      count: 32,
      popularQuestions: ['How to create a campaign?', 'How to track campaign performance?']
    },
    {
      id: 'payments',
      name: 'Payments & Earnings',
      description: 'Everything about payments, withdrawals, and earnings',
      icon: 'payments',
      gradient: 'linear-gradient(135deg, #29bd5aff 0%, #107160ff 100%)',
      count: 22,
      popularQuestions: ['When will I receive my payment?', 'What payment methods are available?']
    },
    {
      id: 'verification',
      name: 'Click Quality & Policy',
      description: 'Learn how tracked links, valid clicks, and policy checks work',
      icon: 'verified',
      gradient: 'linear-gradient(135deg, #8570faff 0%, #5d5005ff 100%)',
      count: 15,
      popularQuestions: ['Why was my activity rejected?', 'How do I protect my tracking link?']
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      description: 'Solve common issues and technical problems',
      icon: 'support_agent',
      gradient: 'linear-gradient(135deg, #da5b25ff 0%, #98103bff 100%)',
      count: 28,
      popularQuestions: ['What if my campaign is not working?', 'How to contact support?']
    }
  ]);

  faqs = signal<FAQ[]>([
    {
      id: 'create-account',
      question: 'How do I create a MarketSpase account?',
      answer: `Creating a MarketSpase account is simple and free:
      <ol>
        <li>Click the "Continue with xxx" button on our homepage</li>
        <li>Authorise MarketSpase authentication on any of the chosen platform</li>
        <li>On first sign up, your current role with be set to Promoter</li>
        <li>Complete your profile setup with basic information</li>
        <li>Start exploring campaigns or create your first one!</li>
      </ol>`,
      category: 'getting-started',
      tags: ['account', 'signup', 'beginner'],
      popular: true,
      //featured: true,
      //lastUpdated: '2 days ago',
      readTime: '3 min'
    },
    {
      id: 'promoter-requirements',
      question: 'What are the requirements to become a promoter?',
      answer: `To become a promoter on MarketSpase, you need:
      <ul>
        <li>A real social audience or community you can promote to responsibly</li>
        <li>A verified phone number</li>
        <li>Completed profile information</li>
        <li>Agreement to our terms and conditions</li>
        <li>Commitment to avoid self-clicking, bots, fake traffic, spam, or link manipulation</li>
        <li>Valid government-issued ID for verification where required for payouts or higher account limits</li>
      </ul>`,
      category: 'getting-started',
      tags: ['promoter', 'requirements', 'eligibility'],
      popular: true,
      lastUpdated: '1 week ago',
      readTime: '2 min'
    },
    {
      id: 'withdraw-earnings',
      question: 'How do I withdraw my earnings?',
      answer: `Withdrawing your earnings is easy:
      <ol>
        <li>Go to your Earnings dashboard</li>
        <li>Click "Withdraw Funds"</li>
        <li>Choose your preferred payment method (bank transfer, mobile money, etc.)</li>
        <li>Enter the amount you want to withdraw</li>
        <li>Confirm your withdrawal details</li>
        <li>Funds will be processed almost immediately</li>
      </ol>
      <p>
      <strong>Note:</strong> 
      Minimum withdrawal amount is ₦200. Processing times may vary based on your payment method.<br />
      Withdrawals can only be made in promoter mode.
      </p>
      `,
      category: 'payments',
      tags: ['withdrawal', 'earnings', 'payments'],
      popular: true,
      lastUpdated: '3 days ago',
      readTime: '4 min'
    },
    {
      id: 'verification-failed',
      question: 'Why was my promotion activity rejected?',
      answer: `Common reasons promotion activity may be rejected or excluded from earnings include:
      <ul>
        <li><strong>Invalid traffic:</strong> self-clicks, repeated clicks, bots, or artificial traffic patterns</li>
        <li><strong>Wrong or modified link:</strong> the original MarketSpase tracking link must stay unchanged</li>
        <li><strong>Spammy activity:</strong> promotions shared in a way that violates campaign or platform policy</li>
        <li><strong>Budget rules:</strong> campaign budget or CPC rules may limit what can be counted</li>
        <li><strong>Missing attribution:</strong> activity that cannot be tied to your unique promoter link</li>
      </ul>
      If you believe this was a mistake, contact support so the team can review the tracking records and account activity.`,
      category: 'verification',
      tags: ['verification', 'failed', 'proof'],
      popular: true,
      lastUpdated: '5 days ago',
      readTime: '3 min'
    },
    {
      id: 'create-campaign',
      question: 'How do I create my first campaign?',
      answer: `Creating a campaign takes just a few minutes:
      <ol>
        <li>Login to your dashboard and switch user role to marketer</li>
        <li>Click "Create Campaign"</li>
        <li>Upload your ad content (images or videos)</li>
        <li>Set your campaign budget and duration</li>
        <li>Define your target audience demographics</li>
        <li>Review and launch your campaign</li>
        <li>Our system will automatically match you with suitable promoters</li>
      </ol>`,
      category: 'campaigns',
      tags: ['campaign', 'create', 'marketer'],
      popular: true,
      featured: true,
      //lastUpdated: '1 week ago',
      //readTime: '5 min'
    },
    {
      id: 'create-campaign',
      question: 'How do I create my first promotion?',
      answer: `Creating a promotion takes just a few minutes:
      <ol>
        <li>Login to your dashboard and switch user role to promoter</li>
        <li>Click "View Promotion"</li>
        <li>Accept a suitable campaign or product promotion from the list of available opportunities</li>
        <li>Click "My Promotion" to view accepted promotions</li>
        <li>Use the approved media, caption, and your unique tracking link</li>
        <li>Follow the campaign instructions and keep the tracking link unchanged</li>
        <li>Share responsibly on WhatsApp, Instagram, Facebook, TikTok, X, or other channels where you have a real audience</li>
      </ol>`,
      category: 'campaigns',
      tags: ['promotion', 'create', 'promoter'],
      popular: true,
      featured: true,
      //lastUpdated: '1 week ago',
      readTime: '50 sec'
    },
    {
      id: 'submit-promotion-proof',
      question: 'Do I still need to submit manual promotion proof?',
      answer: `No. MarketSpase has moved to a tracked-link PPC model:
      <ol>
        <li>Each accepted promotion gives you a unique MarketSpase tracking link</li>
        <li>Clicks, billable activity, conversions, and product orders are tracked automatically where supported</li>
        <li>Do not alter the link or generate fake activity</li>
        <li>Admins may review tracking records and fraud signals if activity looks suspicious</li>
      </ol>`,
      category: 'campaigns',
      tags: ['promotion', 'proof', 'promoter'],
      popular: true,
      featured: true,
      //lastUpdated: '1 week ago',
      readTime: '50 sec'
    },
    {
      id: 'increase-views',
      question: 'How can I improve valid click performance?',
      answer: `Here are proven strategies to improve valid campaign performance:
      <ul>
        <li><strong>Share with the right audience:</strong> Pick campaigns and products that fit your followers</li>
        <li><strong>Use the approved caption and link:</strong> Keep the original MarketSpase tracking link unchanged</li>
        <li><strong>Share valuable content:</strong> Post content that your contacts find useful or entertaining</li>
        <li><strong>Use optimal timing:</strong> Post when your audience is most active</li>
        <li><strong>Cross-promote responsibly:</strong> Share across relevant social channels without spam</li>
        <li><strong>Protect your account quality:</strong> Avoid self-clicking, bots, paid fake traffic, or misleading claims</li>
      </ul>`,
      category: 'campaigns',
      tags: ['views', 'optimization', 'tips'],
      popular: true,
      //lastUpdated: '2 weeks ago',
      readTime: '50 sec'
    }
  ]);

  popularQuestions = signal<PopularQuestion[]>([
    {
      question: 'How long does it take to receive payments?',
      category: 'Payments',
     // views: 15.2,
      answer: 'Eligible earnings are processed after valid tracked activity passes campaign rules, budget checks, and quality review. Processing times may vary based on your chosen payment method and bank processing times.'

    },
    {
      question: 'What is the minimum withdrawal amount?',
      category: 'Payments',
      //views: 12.8,
      answer: 'The minimum withdrawal amount is ₦200. You can withdraw any amount above this threshold at any time from your Earnings dashboard.'
    },
    {
      question: 'How many campaigns can I run at once?',
      category: 'Campaigns',
      //views: 9.7,
      answer: 'You can run multiple promotions simultaneously. However, we recommend managing a reasonable number to ensure each promotion receives adequate attention and resources for optimal performance.'
    },
    {
      question: 'What types of content are not allowed?',
      category: 'Campaigns',
      //views: 8.9,
      answer: 'Prohibited content includes anything illegal, harmful, misleading, or offensive. This includes hate speech, adult content, violence, and misinformation. Please refer to our terms of use guidelines for a comprehensive list.'
    }
  ]);

  constructor() {
    this.setupSearch();
  }

  featuredQuestions = signal<FAQ[]>([]);

  ngOnInit() {
    this.setFeaturedQuestions();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      if (query && query.length > 2) {
        this.performSearch();
      }
    });
  }

  private setFeaturedQuestions(): void {
    const featured = this.faqs().filter(faq => faq.featured);
    this.featuredQuestions.set(featured);
  }

  performSearch(): void {
    const query = this.searchControl.value?.toLowerCase() || '';
    if (query) {
      // Implement search logic
      console.log('Searching for:', query);
    }
  }

  searchByTag(tag: string): void {
    this.searchControl.setValue(tag);
    this.performSearch();
  }

  scrollToCategory(categoryId: string): void {
    this.activeCategory.set(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToQuestion(question: string): void {
    // Implement scroll to specific question
    console.log('Scrolling to question:', question);
  }

  getCategoryFAQs(categoryId: string): FAQ[] {
    return this.faqs().filter(faq => faq.category === categoryId);
  }

  onPanelOpened(faqId: string): void {
    // Track FAQ views or other analytics
    console.log('FAQ opened:', faqId);
  }

  markHelpful(faqId: string): void {
    // Implement helpful feedback
    console.log('Marked helpful:', faqId);
  }

  markNotHelpful(faqId: string): void {
    // Implement not helpful feedback
    console.log('Marked not helpful:', faqId);
  }
}
