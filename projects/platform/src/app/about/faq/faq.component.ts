// faq.component.ts
import { Component, signal, inject } from '@angular/core';
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
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popular?: boolean;
  featured?: boolean;
  lastUpdated: string;
  readTime: string;
}

interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  count: number;
  popularQuestions: string[];
}

interface PopularQuestion {
  question: string;
  category: string;
  views: number;
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
  searchControl = new FormControl('');
  activeCategory = signal<string>('getting-started');

  popularSearches = signal<string[]>([
    'How to withdraw earnings',
    'Campaign verification failed',
    'Reset password',
    'Create first campaign',
    'Increase status views',
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
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      count: 18,
      popularQuestions: ['How to reset my password?', 'How to verify my account?']
    },
    {
      id: 'campaigns',
      name: 'Campaigns',
      description: 'Create, manage, and optimize your marketing campaigns',
      icon: 'campaign',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      count: 32,
      popularQuestions: ['How to create a campaign?', 'How to track campaign performance?']
    },
    {
      id: 'payments',
      name: 'Payments & Earnings',
      description: 'Everything about payments, withdrawals, and earnings',
      icon: 'payments',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      count: 22,
      popularQuestions: ['When will I receive my payment?', 'What payment methods are available?']
    },
    {
      id: 'verification',
      name: 'Verification',
      description: 'Learn about the verification process and requirements',
      icon: 'verified',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      count: 15,
      popularQuestions: ['Why was my verification failed?', 'What proof do I need to provide?']
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      description: 'Solve common issues and technical problems',
      icon: 'support_agent',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      count: 28,
      popularQuestions: ['What if my campaign is not working?', 'How to contact support?']
    }
  ]);

  faqs = signal<FAQ[]>([
    {
      id: 'create-account',
      question: 'How do I create a MarketSpase account?',
      answer: 'Creating a MarketSpase account is simple and free:<ol><li>Click the "Sign Up" button on our homepage</li><li>Choose your role (Marketer or Promoter)</li><li>Enter your email address and create a password</li><li>Verify your email address through the link we send you</li><li>Complete your profile with basic information</li><li>Start exploring campaigns or create your first one!</li></ol>',
      category: 'getting-started',
      tags: ['account', 'signup', 'beginner'],
      popular: true,
      featured: true,
      lastUpdated: '2 days ago',
      readTime: '3 min'
    },
    {
      id: 'promoter-requirements',
      question: 'What are the requirements to become a promoter?',
      answer: 'To become a promoter on MarketSpase, you need:<ul><li>An active WhatsApp account</li><li>Minimum 25 views on your WhatsApp status posts</li><li>A verified phone number</li><li>Completed profile information</li><li>Agreement to our terms and conditions</li><li>Valid government-issued ID for verification (required for higher payouts)</li></ul>',
      category: 'getting-started',
      tags: ['promoter', 'requirements', 'eligibility'],
      popular: true,
      lastUpdated: '1 week ago',
      readTime: '2 min'
    },
    {
      id: 'withdraw-earnings',
      question: 'How do I withdraw my earnings?',
      answer: 'Withdrawing your earnings is easy:<ol><li>Go to your Earnings dashboard</li><li>Click "Withdraw Funds"</li><li>Choose your preferred payment method (bank transfer, mobile money, etc.)</li><li>Enter the amount you want to withdraw</li><li>Confirm your withdrawal details</li><li>Funds will be processed within 24-48 hours</li></ol><p><strong>Note:</strong> Minimum withdrawal amount is ₦1,000. Processing times may vary based on your payment method.</p>',
      category: 'payments',
      tags: ['withdrawal', 'earnings', 'payments'],
      popular: true,
      featured: true,
      lastUpdated: '3 days ago',
      readTime: '4 min'
    },
    {
      id: 'verification-failed',
      question: 'Why was my campaign verification failed?',
      answer: 'Common reasons for verification failure include:<ul><li><strong>Blurry or incomplete screenshots:</strong> Make sure all required proof is clear and complete</li><li><strong>Missing watermarks:</strong> The campaign watermark must be visible in your proof</li><li><strong>Insufficient duration:</strong> Campaign must remain on your status for full 24 hours</li><li><strong>Low view count:</strong> Your status must receive at least 25 views</li><li><strong>Incorrect proof format:</strong> Follow our proof submission guidelines exactly</li></ul>If you believe this was a mistake, you can appeal the decision through your dashboard.',
      category: 'verification',
      tags: ['verification', 'failed', 'proof'],
      popular: true,
      lastUpdated: '5 days ago',
      readTime: '3 min'
    },
    {
      id: 'create-campaign',
      question: 'How do I create my first campaign?',
      answer: 'Creating a campaign takes just a few minutes:<ol><li>Login to your Marketer dashboard</li><li>Click "Create New Campaign"</li><li>Upload your ad content (images or videos)</li><li>Set your campaign budget and duration</li><li>Define your target audience demographics</li><li>Review and launch your campaign</li><li>Our system will automatically match you with suitable promoters</li></ol>',
      category: 'campaigns',
      tags: ['campaign', 'create', 'marketer'],
      popular: true,
      lastUpdated: '1 week ago',
      readTime: '5 min'
    },
    {
      id: 'increase-views',
      question: 'How can I increase my WhatsApp status views?',
      answer: 'Here are proven strategies to increase your status views:<ul><li><strong>Post consistently:</strong> Share content regularly to stay visible</li><li><strong>Engage with your audience:</strong> Respond to messages and interact with viewers</li><li><strong>Share valuable content:</strong> Post content that your contacts find useful or entertaining</li><li><strong>Use optimal timing:</strong> Post when your audience is most active</li><li><strong>Cross-promote:</strong> Mention your status on other social platforms</li><li><strong>Build your network:</strong> Connect with more relevant contacts</li></ul>',
      category: 'campaigns',
      tags: ['views', 'optimization', 'tips'],
      popular: true,
      lastUpdated: '2 weeks ago',
      readTime: '4 min'
    }
  ]);

  popularQuestions = signal<PopularQuestion[]>([
    {
      question: 'How long does it take to receive payments?',
      category: 'Payments',
      views: 15.2
    },
    {
      question: 'What is the minimum withdrawal amount?',
      category: 'Payments',
      views: 12.8
    },
    {
      question: 'How do I reset my password?',
      category: 'Account',
      views: 11.5
    },
    {
      question: 'Why was my account verification failed?',
      category: 'Verification',
      views: 10.3
    },
    {
      question: 'How many campaigns can I run at once?',
      category: 'Campaigns',
      views: 9.7
    },
    {
      question: 'What types of content are not allowed?',
      category: 'Campaigns',
      views: 8.9
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
      distinctUntilChanged()
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