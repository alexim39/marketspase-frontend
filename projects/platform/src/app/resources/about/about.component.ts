// about.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { HeaderComponent } from '../core/header/header.component';
import { FooterComponent } from '../core/footer/footer.component';
import { PUBLIC_TESTIMONIALS, PublicTestimonial } from '../testimonials/testimonial-data';

export interface Statistic {
  value: string;
  label: string;
  icon: string;
  suffix?: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

export interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar: string;
  rating: number;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    HeaderComponent,
    FooterComponent 
  ],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {

 currentYear: number = new Date().getFullYear();
  public heroStatistics = signal<Statistic[]>([
    { value: 'PPC', label: 'Tracked Campaign Model', icon: 'ads_click' },
    { value: 'Live', label: 'Click & Spend Analytics', icon: 'analytics' },
    { value: '1:1', label: 'Promoter Attribution', icon: 'link' },
    { value: '100', label: 'Budget Guard Coverage', icon: 'security', suffix: '%' }
  ]);

  public features = signal<Feature[]>([
    {
      icon: 'auto_awesome',
      title: 'Click Quality Intelligence',
      description: 'Automated checks help detect invalid clicks, suspicious traffic, and promoter activity that can waste campaign budgets.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: 'security',
      title: 'Escrow Payment Protection',
      description: 'Funds held securely in escrow until campaign completion. Automated payouts after successful verification.',
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)'
    },
    {
      icon: 'analytics',
      title: 'Real-time Analytics',
      description: 'Comprehensive dashboards show live clicks, billable activity, spend, conversions, and promoter-level performance.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #10888eff 100%)'
    },
    {
      icon: 'link',
      title: 'Unique Tracked Links',
      description: 'Each campaign or product promotion uses unique links so attribution, spend, and promoter earnings stay traceable.',
      gradient: 'linear-gradient(135deg, #29bd5aff 0%, #107160ff 100%)'
    },
    {
      icon: 'diversity_3',
      title: 'Community Trust',
      description: 'Rating system and reputation scores build trust between marketers and promoters.',
      gradient: 'linear-gradient(135deg, #8570faff 0%, #5d5005ff 100%)'
    },
    {
      icon: 'rocket_launch',
      title: 'Rapid Scaling',
      description: 'Infrastructure designed to handle thousands of concurrent campaigns and promotions across multiple regions.',
      gradient: 'linear-gradient(135deg, #da5b25ff 0%, #98103bff 100%)'
    }
  ]);

  public testimonialHighlights = signal<PublicTestimonial[]>(PUBLIC_TESTIMONIALS.slice(0, 3));

  scrollToMission(): void {
    // Implementation for smooth scrolling to mission section
    const missionSection = document.querySelector('.mission-section');
    missionSection?.scrollIntoView({ behavior: 'smooth' });
  }

  ratingStars(rating: number): number[] {
    return Array.from({ length: rating }, (_, index) => index);
  }
}
