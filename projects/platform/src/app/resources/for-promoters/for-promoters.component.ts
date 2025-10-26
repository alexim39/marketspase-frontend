// for-promoters.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface EarningTier {
  views: string;
  earnings: string;
  description: string;
  popular?: boolean;
}

interface Campaign {
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

interface Testimonial {
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
  benefits = signal<Benefit[]>([
    {
      icon: 'account_balance_wallet',
      title: 'Easy Earnings',
      description: 'Get paid for content you already share. No special skills required - just share posts on your WhatsApp status.'
    },
    {
      icon: 'schedule',
      title: 'Flexible Timing',
      description: 'Work whenever you want. Choose campaigns that fit your schedule and post when it works for you.'
    },
    {
      icon: 'security',
      title: 'Guaranteed Payments',
      description: 'Receive automatic payments within 24 hours after your post gets 25+ views and stays up for 24 hours.'
    },
    {
      icon: 'groups',
      title: 'Build Your Audience',
      description: 'Grow your WhatsApp network while earning. Share interesting content that your contacts will appreciate.'
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
      earnings: '₦500 - ₦1,000',
      description: 'Perfect for beginners with smaller networks',
      popular: false
    }, */
    {
      views: '25+',
      earnings: '₦200',
      description: 'Great for all active users with engaged WhatsApp contacts',
      popular: true
    },
   /*  {
      views: '100+',
      earnings: '₦2,000 - ₦5,000',
      description: 'Premium campaigns for large, active audiences',
      popular: false
    } */
  ]);

  sampleCampaigns = signal<Campaign[]>([
    {
      id: '1',
      title: 'Tech Gadgets Promotion',
      description: 'Share exciting new tech products with your network and earn commission for every view.',
      earnings: '₦1,500',
      duration: '24 hours',
      viewsRequired: 25,
      category: 'Technology',
      marketer: 'TechStore NG',
      marketerRating: 4.8,
      urgency: 'high'
    },
    {
      id: '2',
      title: 'Fashion Brand Launch',
      description: 'Help launch a new African fashion brand by sharing their collection on your status.',
      earnings: '₦2,000',
      duration: '24 hours',
      viewsRequired: 25,
      category: 'Fashion',
      marketer: 'AfroStyle',
      marketerRating: 4.9,
      urgency: 'medium'
    },
    {
      id: '3',
      title: 'Food Delivery Service',
      description: 'Promote food delivery discounts to your contacts and earn for every successful view.',
      earnings: '₦1,200',
      duration: '24 hours',
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
      earnings: '₦85,000',
      content: 'I started promoting to pay for my school fees. Now I earn enough to cover my expenses and even save some money. The best part is I can do it between classes!',
      avatar: '/img/resources/avatar/aisha.png',
      stats: [
        { metric: 'Campaigns', value: '42' },
        { metric: 'Success Rate', value: '98%' },
        { metric: 'Avg. Earnings', value: '₦2,024' }
      ]
    },
    {
      name: 'Chinedu Okoro',
      role: 'Entrepreneur',
      earnings: '₦120,000',
      content: 'I use MarketSpase to supplement my business income. The flexibility allows me to promote during my free time, and the earnings help with my business expenses.',
      avatar: '/img/resources/avatar/chinedu.png',
      stats: [
        { metric: 'Campaigns', value: '67' },
        { metric: 'Success Rate', value: '95%' },
        { metric: 'Avg. Earnings', value: '₦1,791' }
      ]
    },
    {
      name: 'Aliu Ibrahim',
      role: 'Freelancer',
      earnings: '₦72,000',
      content: 'As a freelancer, MarketSpase gives me stable extra income. I run 2-3 campaigns weekly and earn consistently. The payment system is reliable and fast.',
      avatar: '/img/resources/avatar/aliu.png',
      stats: [
        { metric: 'Campaigns', value: '84' },
        { metric: 'Success Rate', value: '78%' },
        { metric: 'Avg. Earnings', value: '₦850' }
      ]
    }
  ]);

  scrollToHowItWorks(): void {
    const element = document.querySelector('.process-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

   // public Facebook reel/video URL (must be public)
  readonly fbUrl = 'https://web.facebook.com/reel/1122807266576576';
  posterUrl = 'img/placeholders/how-to-video.jpg'; // replace with proper poster image
  videoUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // Preload video URL but do not show player until clicked
    const plugin = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(this.fbUrl)}&show_text=0&autoplay=1`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(plugin);
  }
}