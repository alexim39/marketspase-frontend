// about.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

interface Statistic {
  value: string;
  label: string;
  icon: string;
  suffix?: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

interface Testimonial {
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
    { value: '2B', label: 'WhatsApp Users Worldwide', icon: 'group', suffix: '+' },
    { value: '24', label: 'Hour Status Duration', icon: 'schedule', suffix: 'h' },
    { value: '25', label: 'Minimum Views Required', icon: 'visibility', suffix: '+' },
    { value: '100', label: 'Secure Payment Guarantee', icon: 'security', suffix: '%' }
  ]);

  public features = signal<Feature[]>([
    {
      icon: 'auto_awesome',
      title: 'AI-Powered Verification',
      description: 'Advanced computer vision and AI algorithms automatically verify posts and track 24-hour duration with 99% accuracy.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: 'security',
      title: 'Escrow Payment Protection',
      description: 'Funds held securely in escrow until campaign completion. Automated payouts after successful verification.',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      icon: 'analytics',
      title: 'Real-time Analytics',
      description: 'Comprehensive dashboard with live campaign performance, view counts, and earnings tracking.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      icon: 'watermark',
      title: 'Embedded Watermarking & Unique IDs',
      description: 'Automatic unique promotion ID and embedded watermarking for each campaign to prevent fraud and ensure authenticity.',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    },
    {
      icon: 'diversity_3',
      title: 'Community Trust',
      description: 'Rating system and reputation scores build trust between marketers and promoters.',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    },
    {
      icon: 'rocket_launch',
      title: 'Rapid Scaling',
      description: 'Infrastructure designed to handle thousands of concurrent campaigns across multiple regions.',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    }
  ]);

  scrollToMission(): void {
    // Implementation for smooth scrolling to mission section
    const missionSection = document.querySelector('.mission-section');
    missionSection?.scrollIntoView({ behavior: 'smooth' });
  }
}