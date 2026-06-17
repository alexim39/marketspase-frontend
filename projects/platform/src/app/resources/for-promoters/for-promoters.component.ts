// for-promoters.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { HeaderComponent } from '../core/header/header.component';
import { FooterComponent } from '../core/footer/footer.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export interface EarningTier {
  views: string;
  earnings: string;
  description: string;
  popular?: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  earnings: string;
  duration: string;
  viewsRequired: number;
  category: string;
  marketer: string;
  marketerRating: number;
  urgency: 'low' | 'medium' | 'high';
}

export interface Testimonial {
  name: string;
  role: string;
  earnings: string;
  content: string;
  avatar: string;
  stats: {
    metric: string;
    value: string;
  }[];
}

@Component({
  selector: 'app-for-promoters',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    HeaderComponent,
    FooterComponent 
  ],
  templateUrl: './for-promoters.component.html',
  styleUrls: ['./for-promoters.component.scss']
})
export class ForPromotersComponent {
  private readonly sanitizer = inject(DomSanitizer);

  benefits = signal<Benefit[]>([
    {
      icon: 'account_balance_wallet',
      title: 'Easy Earnings',
      description: 'Earn from valid performance on tracked campaign and product links you share with real audiences.'
    },
    {
      icon: 'schedule',
      title: 'Flexible Timing',
      description: 'Work whenever you want. Choose campaigns that fit your schedule and post when it works for you.'
    },
    {
      icon: 'security',
      title: 'Guaranteed Payments',
      description: 'Valid earnings move through your wallet once campaign activity passes quality checks and budget rules.'
    },
    {
      icon: 'groups',
      title: 'Build Your Audience',
      description: 'Grow your social audience while sharing useful offers, products, and campaigns that fit their interests.'
    },
    {
      icon: 'trending_up',
      title: 'Scale Your Income',
      description: 'Start with one campaign and gradually take on more as you build confidence and grow your audience.'
    },
    {
      icon: 'support_agent',
      title: '24/7 Support',
      description: 'Our support team is always available to help you with any questions or issues you encounter.'
    }
  ]);

  earningTiers = signal<EarningTier[]>([
   /*  {
      views: '25-50',
      earnings: 'â‚¦500 - â‚¦1,000',
      description: 'Perfect for beginners with smaller networks',
      popular: false
    }, */
    {
      views: 'Valid clicks',
      earnings: 'Campaign CPC',
      description: 'Earn from valid tracked activity on accepted campaigns, subject to quality checks and campaign budget rules.',
      popular: true
    },
   /*  {
      views: '100+',
      earnings: 'â‚¦2,000 - â‚¦5,000',
      description: 'Premium campaigns for large, active audiences',
      popular: false
    } */
  ]);

  sampleCampaigns = signal<Campaign[]>([
    {
      id: '1',
      title: 'Tech Gadgets Promotion',
      description: 'Share a tracked campaign link for new tech products and earn from valid campaign activity.',
      earnings: 'PPC-based',
      duration: 'Budget active',
      viewsRequired: 25,
      category: 'Technology',
      marketer: 'TechStore NG',
      marketerRating: 4.8,
      urgency: 'high'
    },
    {
      id: '2',
      title: 'Fashion Brand Launch',
      description: 'Promote a new African fashion collection with your unique tracked campaign link.',
      earnings: 'PPC-based',
      duration: 'Budget active',
      viewsRequired: 25,
      category: 'Fashion',
      marketer: 'AfroStyle',
      marketerRating: 4.9,
      urgency: 'medium'
    },
    {
      id: '3',
      title: 'Food Delivery Service',
      description: 'Share food delivery offers through a MarketSpase link and track valid click activity.',
      earnings: 'Campaign CPC',
      duration: 'Budget active',
      viewsRequired: 25,
      category: 'Food & Drink',
      marketer: 'QuickBite NG',
      marketerRating: 4.7,
      urgency: 'low'
    }
  ]);

  promoterTestimonials = signal<Testimonial[]>([
    {
      name: 'Aisha Mohammed',
      role: 'Student & Promoter',
      earnings: 'Verified payouts',
      content: 'I started promoting campaigns between classes. The tracked links make it easier to see what is working and keep my account quality clean.',
      avatar: '/img/resources/avatar/aisha.png',
      stats: [
        { metric: 'Campaigns', value: '42' },
        { metric: 'Success Rate', value: '98%' },
        { metric: 'Quality Score', value: 'Verified' }
      ]
    },
    {
      name: 'Chinedu Okoro',
      role: 'Entrepreneur',
      earnings: 'Verified payouts',
      content: 'I use MarketSpase to promote useful products to my audience. The PPC model helps me focus on real clicks and better campaign performance.',
      avatar: '/img/resources/avatar/chinedu.png',
      stats: [
        { metric: 'Campaigns', value: '67' },
        { metric: 'Success Rate', value: '95%' },
        { metric: 'Quality Score', value: 'Verified' }
      ]
    },
    {
      name: 'Aliu Ibrahim',
      role: 'Freelancer',
      earnings: 'Verified payouts',
      content: 'As a freelancer, MarketSpase gives me structured campaigns to share. I can track clicks, keep my activity compliant, and grow my promoter rating.',
      avatar: '/img/resources/avatar/aliu.png',
      stats: [
        { metric: 'Campaigns', value: '84' },
        { metric: 'Success Rate', value: '78%' },
        { metric: 'Quality Score', value: 'Verified' }
      ]
    }
  ]);

  scrollToHowItWorks(): void {
    const element = document.querySelector('.process-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  posterUrl = 'img/placeholders/how-to-video.jpg'; // replace with proper poster image
  videoUrl!: SafeResourceUrl;

  ngOnInit(): void {
    this.videoUrl = this.buildYoutubeEmbedUrl('jp3LnrZusxA', 23);
  }

  private buildYoutubeEmbedUrl(videoId: string, startSeconds: number): SafeResourceUrl {
    const params = new URLSearchParams({
      start: String(startSeconds),
      rel: '0',
      modestbranding: '1',
      playsinline: '1'
    });

    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}?${params}`);
  }
}


