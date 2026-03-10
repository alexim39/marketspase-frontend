// benefit.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { HeaderComponent } from '../core/header/header.component';
import { FooterComponent } from '../core/footer/footer.component';

interface Benefit {
  icon: string;
  title: string;
  description: string;
  category: 'business' | 'promoter' | 'platform';
}

@Component({
  selector: 'app-benefit',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './benefits.component.html',
  styleUrls: ['./benefits.component.scss']
})
export class BenefitsComponent {
  // Benefits for Businesses
  businessBenefits = signal<Benefit[]>([
    {
      icon: 'groups',
      title: 'Reach More Customers',
      description: 'Promoters help share your products across WhatsApp and social media networks, expanding your reach exponentially.',
      category: 'business'
    },
    {
      icon: 'campaign',
      title: 'Powerful Social Marketing',
      description: 'Instead of marketing alone, you get a network of promoters helping advertise your products to their audiences.',
      category: 'business'
    },
    {
      icon: 'paid',
      title: 'Pay Only For Results',
      description: 'You only pay commissions when promoters help generate real sales, ensuring your marketing budget is well spent.',
      category: 'business'
    },
    {
      icon: 'analytics',
      title: 'Track Your Sales',
      description: 'Monitor sales performance and see which promoters bring the most customers with detailed analytics.',
      category: 'business'
    },
    {
      icon: 'speed',
      title: 'Fast Campaign Launch',
      description: 'Create and launch marketing campaigns in minutes, not days, and start getting results immediately.',
      category: 'business'
    },
    {
      icon: 'insights',
      title: 'Customer Insights',
      description: 'Gain valuable insights about your customers and which marketing messages resonate best.',
      category: 'business'
    }
  ]);

  // Benefits for Promoters
  promoterBenefits = signal<Benefit[]>([
    {
      icon: 'smartphone',
      title: 'Earn From Your WhatsApp',
      description: 'Share product links on WhatsApp status and earn commissions when people buy through your referral links.',
      category: 'promoter'
    },
    {
      icon: 'inventory',
      title: 'No Product Investment',
      description: "You don't need to buy products or keep inventory. Simply promote products you love and earn commissions.",
      category: 'promoter'
    },
    {
      icon: 'attach_money',
      title: 'High Commission Potential',
      description: 'Some promotions can earn you thousands of naira per successful sale, with competitive commission rates.',
      category: 'promoter'
    },
    {
      icon: 'trending_up',
      title: 'Unlimited Earnings',
      description: 'The more people you reach and the more products you promote, the more commissions you can earn.',
      category: 'promoter'
    },
    {
      icon: 'schedule',
      title: 'Flexible Schedule',
      description: 'Promote products on your own time. There are no fixed hours – work when it suits you.',
      category: 'promoter'
    },
    {
      icon: 'emoji_events',
      title: 'Performance Bonuses',
      description: 'Top performers earn additional bonuses and rewards through our promoter recognition program.',
      category: 'promoter'
    }
  ]);

  // Platform Benefits
  platformBenefits = signal<Benefit[]>([
    {
      icon: 'security',
      title: 'Secure Transactions',
      description: 'Built with bank-grade security systems that protect both buyers and sellers on every transaction.',
      category: 'platform'
    },
    {
      icon: 'hub',
      title: 'Affiliate Marketplace',
      description: 'A robust platform where businesses and promoters collaborate to drive real sales and growth.',
      category: 'platform'
    },
    {
      icon: 'bolt',
      title: 'Simple & Fast',
      description: 'Create a store, promote products, and start earning within minutes. No technical skills required.',
      category: 'platform'
    },
    {
      icon: 'public',
      title: 'Scalable Growth',
      description: 'Built to support thousands of promoters and businesses across Nigeria and beyond.',
      category: 'platform'
    },
    {
      icon: 'support_agent',
      title: '24/7 Support',
      description: 'Our dedicated support team is always available to help with any questions or issues.',
      category: 'platform'
    },
    {
      icon: 'verified',
      title: 'Fraud Protection',
      description: 'Advanced AI verification ensures genuine engagement and protects against fraudulent activities.',
      category: 'platform'
    }
  ]);

  // Statistics for hero section
  stats = signal([
    { value: '10K+', label: 'Active Promoters' },
    { value: '₦Millions', label: 'Monthly Sales' },
    { value: '5 Mins', label: 'Setup Time' },
    { value: '500+', label: 'Businesses' }
  ]);

  // Current year for footer
  currentYear = new Date().getFullYear();
}