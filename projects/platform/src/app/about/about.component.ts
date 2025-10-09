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
      description: 'Advanced computer vision and AI algorithms automatically verify submited screenshot and track 24-hour duration with 99% accuracy.',
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
      description: 'Comprehensive dashboard with live campaign performance, view counts, and earnings tracking.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #10888eff 100%)'
    },
    {
      icon: 'watermark',
      title: 'Embedded Watermarking & Unique IDs',
      description: 'Unique promotion ID and impeccably embedded watermarking for each campaign to prevent fraud and ensure authenticity.',
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

  scrollToMission(): void {
    // Implementation for smooth scrolling to mission section
    const missionSection = document.querySelector('.mission-section');
    missionSection?.scrollIntoView({ behavior: 'smooth' });
  }
}