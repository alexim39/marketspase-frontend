// help-center.component.ts
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HeaderComponent } from '../core/header/header.component';
import { FooterComponent } from '../core/footer/footer.component';

export interface FAQ {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  popular?: boolean;
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  articleCount: number;
  popularArticles: string[];
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  lastUpdated: string;
  tags: string[];
  featured?: boolean;
  steps?: string[];
}

export interface ContactOption {
  icon: string;
  title: string;
  description: string;
  action: string;
  availability: string;
  gradient: string;
}

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatChipsModule,
    ReactiveFormsModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './help-center.component.html',
  styleUrls: ['./help-center.component.scss'],
})
export class HelpCenterComponent {
  private readonly destroyRef = inject(DestroyRef);

  searchControl = new FormControl('');

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

  helpCategories = signal<HelpCategory[]>([
    {
      id: 'getting-started',
      name: 'Getting Started',
      description: 'Learn the basics and set up your MarketSpase account',
      icon: 'rocket_launch',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      articleCount: 45,
      popularArticles: ['Account Setup Guide', 'First Campaign Tutorial', 'Profile Optimization']
    },
    {
      id: 'account-management',
      name: 'Account & Profile',
      description: 'Manage your account settings, profile, and security',
      icon: 'account_circle',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      articleCount: 32,
      popularArticles: ['Password Reset', 'Profile Verification', 'Account Security']
    },
    {
      id: 'campaigns',
      name: 'Campaigns',
      description: 'Create, manage, and optimize your marketing campaigns',
      icon: 'campaign',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      articleCount: 68,
      popularArticles: ['Campaign Creation', 'Performance Tracking', 'Budget Optimization']
    },
    {
      id: 'payments',
      name: 'Payments & Earnings',
      description: 'Everything about payments, withdrawals, and earnings',
      icon: 'payments',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      articleCount: 28,
      popularArticles: ['Withdrawal Process', 'Payment Methods', 'Earnings Calculation']
    },
    {
      id: 'verification',
      name: 'Click Quality & Policy',
      description: 'Learn how tracked links, valid clicks, and policy checks work',
      icon: 'verified',
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      articleCount: 24,
      popularArticles: ['Tracking Link Rules', 'Activity Review', 'Appeal Process']
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      description: 'Solve common issues and technical problems',
      icon: 'support_agent',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      articleCount: 56,
      popularArticles: ['Login Issues', 'Campaign Errors', 'Payment Problems']
    }
  ]);

  featuredArticles = signal<Article[]>([
    {
      id: 'complete-beginners-guide',
      title: 'Complete Beginner\'s Guide to MarketSpase',
      excerpt: 'Learn everything you need to know to get started as a marketer or promoter on our platform.',
      category: 'Getting Started',
      readTime: '10 min',
      lastUpdated: '2 days ago',
      tags: ['beginner', 'guide', 'tutorial'],
      featured: true,
      steps: [
        'Create your account',
        'Complete your profile',
        'Verify your identity',
        'Start your first campaign or promotion'
      ]
    },
    {
      id: 'maximize-earnings',
      title: 'How to Maximize Your Earnings as a Promoter',
      excerpt: 'Proven strategies to improve valid clicks, product activity, and campaign performance with tracked links.',
      category: 'Payments & Earnings',
      readTime: '8 min',
      lastUpdated: '1 week ago',
      tags: ['earnings', 'optimization', 'tips'],
      featured: true
    },
    {
      id: 'campaign-optimization',
      title: 'Advanced Campaign Optimization Guide',
      excerpt: 'Learn how to optimize your campaigns for maximum ROI and engagement.',
      category: 'Campaigns',
      readTime: '12 min',
      lastUpdated: '3 days ago',
      tags: ['campaigns', 'optimization', 'roi']
    },
    {
      id: 'verification-success',
      title: 'How to Protect Your Tracking Link Quality',
      excerpt: 'Follow these steps to keep your promotion activity compliant and eligible for campaign earnings.',
      category: 'Click Quality & Policy',
      readTime: '6 min',
      lastUpdated: '5 days ago',
      tags: ['tracking', 'quality', 'guidelines']
    }
  ]);

  faqs = signal<FAQ[]>([
    {
      question: 'How do I create my first campaign?',
      answer: 'To create your first campaign: <ol><li>Go to the Campaigns section in your dashboard</li><li>Click "Create New Campaign"</li><li>Upload your ad content and set your budget</li><li>Define your target audience</li><li>Review and launch your campaign</li></ol>',
      category: 'getting-started',
      tags: ['campaign', 'create', 'beginner'],
      popular: true
    },
    {
      question: 'How long does it take to receive payments?',
      answer: 'Eligible earnings are processed after valid tracked activity passes campaign rules, budget checks, and quality review. Standard processing time is 24-48 hours. For bank transfers, additional 1-3 business days may be required depending on your bank.',
      category: 'payments',
      tags: ['payments', 'withdrawal', 'timing'],
      popular: true
    },
    {
      question: 'Why was my promotion activity rejected?',
      answer: 'Common reasons include: <ul><li>Self-clicks, bots, repeated clicks, or artificial traffic patterns</li><li>Modified or incorrect tracking links</li><li>Spammy sharing or campaign policy violations</li><li>Campaign budget or CPC limits</li><li>Activity that cannot be attributed to your unique promoter link</li></ul>',
      category: 'verification',
      tags: ['tracking', 'quality', 'policy'],
      popular: true
    },
    {
      question: 'How can I improve valid click performance?',
      answer: 'To improve valid performance: <ul><li>Choose campaigns that fit your real audience</li><li>Use the approved caption, media, and MarketSpase tracking link</li><li>Share on relevant social channels without spam</li><li>Post when your audience is active</li><li>Avoid self-clicking, bots, fake traffic, or misleading claims</li></ul>',
      category: 'campaigns',
      tags: ['clicks', 'optimization', 'tips']
    },
    {
      question: 'What are the minimum requirements for promoters?',
      answer: 'To become a promoter, you need: <ul><li>A real audience or community you can promote to responsibly</li><li>Verified phone number</li><li>Completed profile information</li><li>Agreement to terms and conditions</li><li>Commitment to avoid self-clicking, bots, fake traffic, spam, or link manipulation</li></ul>',
      category: 'getting-started',
      tags: ['requirements', 'promoter', 'eligibility']
    }
  ]);

  contactOptions = signal<ContactOption[]>([
    {
      icon: 'chat',
      title: 'Live Chat',
      description: 'Get instant help from our support team in real-time',
      action: 'Start Chat',
      availability: 'Available 24/7',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: 'email',
      title: 'Email Support',
      description: 'Send us a detailed message and get a response within hours',
      action: 'Send Email',
      availability: 'Response within 2 hours',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: 'forum',
      title: 'Community Forum',
      description: 'Get help from other experienced users and community experts',
      action: 'Visit Forum',
      availability: 'Always available',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: 'phone',
      title: 'Phone Support',
      description: 'Speak directly with our support specialists',
      action: 'Call Now',
      availability: 'Mon-Fri, 9AM-6PM',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ]);

  constructor() {
    this.setupSearch();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => {
      if (query && query.length > 2) {
        this.performSearch(query);
      }
    });
  }

  performSearch(query: string): void {
    // Implement search functionality
    console.log('Searching for:', query);
  }

  searchByTag(tag: string): void {
    this.searchControl.setValue(tag);
    this.performSearch(tag);
  }

  scrollToCategory(categoryId: string): void {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  openArticle(articleId: string): void {
    // Navigate to article or open in modal
    console.log('Opening article:', articleId);
  }

  initiateContact(contactMethod: string): void {
    // Implement contact initiation
    console.log('Initiating contact via:', contactMethod);
  }

  getCategoryFAQs(categoryId: string): FAQ[] {
    return this.faqs().filter(faq => faq.category === categoryId);
  }
}
