// features.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { TestimonialsComponent } from '../../dashboard/testimonial/testimonial.component';

interface Feature {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
  category: 'marketer' | 'promoter' | 'platform';
}

interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
}

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  gradient: string;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  rating: number;
}

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatCheckboxModule,
    HeaderComponent,
    FooterComponent,
    TestimonialsComponent
  ],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent {
  activeCategory = signal<'marketer' | 'promoter' | 'platform'>('marketer');
  activeTab = signal(0);

  featureCategories = signal<FeatureCategory[]>([
    {
      id: 'marketer',
      name: 'For Marketers',
      description: 'Powerful tools to create, manage, and optimize your WhatApp status campaigns',
      icon: 'campaign',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'promoter',
      name: 'For Promoters',
      description: 'Everything you need to earn from your WhatsApp status',
      icon: 'groups',
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)'
    },
    {
      id: 'platform',
      name: 'Platform Features',
      description: 'Advanced AI technology powering the entire ecosystem',
      icon: 'auto_awesome',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #10888eff 100%)'
    }
  ]);

  features = signal<Feature[]>([
    // Marketer Features
    {
      icon: 'analytics',
      title: 'Advanced Analytics',
      description: 'Real-time campaign performance tracking with detailed insights and ROI measurement.',
      benefits: [
        'Real-time performance dashboard',
        'ROI and conversion tracking',
        'Audience engagement metrics',
        'Competitive benchmarking'
      ],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      category: 'marketer'
    },
    {
      icon: 'ads_click',
      title: 'Smart Targeting',
      description: 'Reach your ideal audience with advanced demographic and interest-based targeting.',
      benefits: [
        'Demographic targeting',
        'Interest-based filters',
        'Location targeting',
        'Audience behavior analysis'
      ],
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)',
      category: 'marketer'
    },
    {
      icon: 'auto_awesome',
      title: 'AI Optimization',
      description: 'Automatically optimize your campaigns based on performance data and machine learning.',
      benefits: [
        'Automated bid optimization',
        'Performance prediction',
        'A/B testing automation',
        'Smart budget allocation'
      ],
      gradient: 'linear-gradient(135deg, #4facfe 0%, #10888eff 100%)',
      category: 'marketer'
    },
    {
      icon: 'watermark',
      title: 'Secure Watermarking',
      description: 'Unique promotioin ID and impeccably embedded watermarking for each promtion to ensure authenticity and prevent fraud.',
      benefits: [
        'Automatic watermark generation',
        'Unique campaign identifiers',
        'Fraud prevention',
        'Content protection'
      ],
      gradient: 'linear-gradient(135deg, #29bd5aff 0%, #107160ff 100%)',
      category: 'marketer'
    },

    // Promoter Features
    {
      icon: 'trending_up',
      title: 'Earnings Dashboard',
      description: 'Track your earnings, pending payments, and campaign performance in one place.',
      benefits: [
        'Real-time earnings tracking',
        'Payment history',
        'Performance analytics',
        'Earnings projections'
      ],
      gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      category: 'promoter'
    },
    {
      icon: 'campaign',
      title: 'Smart Campaign Matching',
      description: 'Get personalized campaign recommendations based on your audience and performance.',
      benefits: [
        'Personalized recommendations',
        'Audience matching',
        'Performance-based suggestions',
        'Category preferences'
      ],
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      category: 'promoter'
    },
    {
      icon: 'verified',
      title: 'Rating System',
      description: 'Build your reputation and unlock higher-paying campaigns with our rating system.',
      benefits: [
        'Performance-based ratings',
        'Trust score building',
        'Premium campaign access',
        'Rating visibility'
      ],
      gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
      category: 'promoter'
    },
    {
      icon: 'payments',
      title: 'Instant Payments',
      description: 'Get paid automatically after campaign verification with multiple withdrawal options.',
      benefits: [
        'Automated payment processing',
        'Multiple withdrawal methods',
        'Instant bank transfers',
        'Payment history tracking'
      ],
      gradient: 'linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)',
      category: 'promoter'
    },

    // Platform Features
    {
      icon: 'security',
      title: 'Enterprise Security',
      description: 'Bank-grade security with end-to-end encryption and advanced fraud detection.',
      benefits: [
        'End-to-end encryption',
        'PCI DSS compliance',
        'Advanced fraud detection',
        'Regular security audits'
      ],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      category: 'platform'
    },
    {
      icon: 'smart_toy',
      title: 'AI Verification',
      description: 'Advanced computer vision and ML algorithms verify campaign posts with 99.8% accuracy.',
      benefits: [
        'Computer vision technology',
        'Real-time verification',
        'Fraud pattern detection',
        'Continuous learning'
      ],
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      category: 'platform'
    },
    {
      icon: 'auto_awesome',
      title: 'Auto Scaling',
      description: 'Cloud-native architecture that automatically scales to handle millions of users.',
      benefits: [
        'Microservices architecture',
        'Auto-scaling infrastructure',
        'Global CDN',
        '99.9% uptime SLA'
      ],
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      category: 'platform'
    },
    {
      icon: 'support_agent',
      title: '24/7 Support',
      description: 'Round-the-clock customer support with dedicated teams for marketers and promoters.',
      benefits: [
        '24/7 live chat support',
        'Dedicated account managers',
        'Phone and email support',
        'Community forums'
      ],
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      category: 'platform'
    }
  ]);

  pricingTiers = signal<PricingTier[]>([
    {
      name: 'Marketers',
      price: '10% ',
      period: ' Transaction',
      description: 'No monthly fees. Pay only 10% service charge on fund deposit.',
      features: [],
      // features: [
      //   'Up to 5 active campaigns',
      //   'Basic analytics',
      //   'Standard support',
      //   'Manual verification',
      //   'Up to 100 promoters'
      // ],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    // {
    //   name: 'Professional',
    //   price: '₦25,000',
    //   period: 'month',
    //   description: 'Ideal for growing businesses and agencies',
    //   features: [
    //     'Up to 50 active campaigns',
    //     'Advanced analytics',
    //     'Priority support',
    //     'AI verification',
    //     'Up to 1,000 promoters',
    //     'A/B testing',
    //     'API access'
    //   ],
    //   popular: true,
    //   gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    // },
    {
      name: 'Promoters',
      price: '15% ',
      period: ' Transaction',
      description: 'No subscription fees. Pay only 15% service charge on fund withdrawal.',
      features: [],
      // features: [
      //   'Unlimited campaigns',
      //   'Enterprise analytics',
      //   'Dedicated support',
      //   'Custom AI models',
      //   'Unlimited promoters',
      //   'Advanced API',
      //   'Custom integrations',
      //   'SLA guarantee'
      // ],
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)'
    }
  ]);

  // testimonials = signal<Testimonial[]>([
  //   {
  //     name: 'Adeola Johnson',
  //     role: 'Marketing Director',
  //     company: 'Nigerian Breweries',
  //     content: 'MarketSpase transformed our digital marketing strategy. The ROI is incredible and the platform is so easy to use.',
  //     avatar: '/assets/testimonials/adeola.jpg',
  //     rating: 5
  //   },
  //   {
  //     name: 'Chinedu Okoro',
  //     role: 'Content Creator',
  //     company: 'Self-Employed',
  //     content: 'I\'ve earned over ₦500,000 in 6 months just by sharing campaigns on my WhatsApp status. Life-changing platform!',
  //     avatar: '/assets/testimonials/chinedu.jpg',
  //     rating: 5
  //   },
  //   {
  //     name: 'Bisi Adekunle',
  //     role: 'CEO',
  //     company: 'Fashion Haven NG',
  //     content: 'The targeting capabilities are amazing. We reached exactly the right audience and saw a 300% increase in engagement.',
  //     avatar: '/assets/testimonials/bisi.jpg',
  //     rating: 5
  //   }
  // ]);

  filteredFeatures = signal<Feature[]>([]);

  constructor() {
    this.updateFilteredFeatures();
  }

  setActiveCategory(category: 'marketer' | 'promoter' | 'platform'): void {
    this.activeCategory.set(category);
    this.updateFilteredFeatures();
  }

  setActiveTab(index: number): void {
    this.activeTab.set(index);
  }

  private updateFilteredFeatures(): void {
    const filtered = this.features().filter(feature => feature.category === this.activeCategory());
    this.filteredFeatures.set(filtered);
  }
}