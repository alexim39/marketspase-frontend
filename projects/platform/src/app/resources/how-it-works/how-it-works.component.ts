// how-it-works.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { HeaderComponent } from '../core/header/header.component';
import { FooterComponent } from '../core/footer/footer.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  features: string[];
  duration?: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  benefits: string[];
  idealFor: string[];
}

export interface FeatureHighlight {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatStepperModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './how-it-works.component.html',
  styleUrls: ['./how-it-works.component.scss']
})
export class HowItWorksComponent {
  userRoles = signal<UserRole[]>([
    {
      id: 'marketer',
      name: 'Marketers',
      description: 'Businesses and individuals looking to market products or services through tracked promoter links and measurable PPC campaigns.',
      icon: 'campaign',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      benefits: [
        'Reach authentic, engaged audiences',
        'Pay only for verified results',
        'Real-time campaign analytics',
        'AI-powered audience targeting'
      ],
      idealFor: [
        'Small Businesses',
        'E-commerce Stores',
        'Startups',
        'Digital Agencies',
        'Content Creators',
        'etc.'
      ]
    },
    {
      id: 'promoter',
      name: 'Promoters',
      description: 'Individuals who want to earn money by sharing approved campaign and product links with real audiences.',
      icon: 'groups',
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)',
      benefits: [
        'Earn from your social influence',
        'Flexible working hours',
        'Automated payments',
        'Build your promoter rating'
      ],
      idealFor: [
        'Students',
        'Stay-at-home Parents',
        'Freelancers',
        'Content Creators',
        'Anyone with a real audience'
      ]
    }
  ]);

  processSteps = signal<ProcessStep[]>([
    {
      number: '01',
      title: 'Create & Set Up',
      description: 'Marketers create campaigns with their ad content, set budgets, and define target audiences. Promoters complete their profiles and verify their accounts.',
      icon: 'rocket_launch',
      //image: '/img/process/create-campaign.png',
      features: ['Campaign Creation', 'Profile Setup', 'Audience Targeting', 'Budget Setting'],
      duration: '5 minutes'
    },
    {
      number: '02',
      title: 'Match & Connect',
      description: 'Our AI system matches campaigns with promoters whose audience aligns with the target demographics. Promoters browse and accept suitable campaigns.',
      icon: 'connect_without_contact',
      //image: '/img/process/matching.jpg',
      features: ['AI Matching', 'Campaign Browsing', 'Smart Recommendations', 'One-Click Accept']
    },
    {
      number: '03',
      title: 'Share & Promote',
      description: 'Promoters share approved media, captions, and unique MarketSpase tracking links across social channels. Marketers monitor clicks, spend, conversions, and promoter performance in real time.',
      icon: 'share',
      //image: '/img/process/share-status.jpg',
      features: ['Easy Sharing', 'Real-time Tracking', 'Unique Links', 'PPC Attribution']
    },
    {
      number: '04',
      title: 'Validate Activity & Earn',
      description: 'The platform validates click quality, campaign budget, promoter activity, and conversion records before eligible earnings move to the promoter wallet and marketers receive performance reports.',
      icon: 'verified',
      //image: '/img/process/verification.jpg',
      features: ['Click Quality Checks', 'Auto Payments', 'Performance Reports', 'Earnings Tracking']
    }
  ]);

  platformFeatures = signal<FeatureHighlight[]>([
    {
      icon: 'smart_toy',
      title: 'AI-Powered Matching',
      description: 'Intelligent algorithm matches campaigns with promoters based on audience demographics and performance history.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: 'link',
      title: 'Secure Tracked Links',
      description: 'Unique campaign and product links connect every click, conversion, and spend record to the right promoter.',
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)'
    },
    {
      icon: 'auto_awesome',
      title: 'Automated Quality Checks',
      description: 'Automated checks help detect suspicious click patterns, invalid activity, and policy risks in real time.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #10888eff 100%)'
    },
    {
      icon: 'payments',
      title: 'Instant Payments',
      description: 'Automated payment processing with multiple withdrawal options and instant bank transfers.',
      gradient: 'linear-gradient(135deg, #29bd5aff 0%, #107160ff 100%)'
    },
    {
      icon: 'analytics',
      title: 'Real-time Analytics',
      description: 'Comprehensive dashboard with live campaign performance, earnings tracking, and audience insights.',
      gradient: 'linear-gradient(135deg, #8570faff 0%, #5d5005ff 100%)'
    },
    {
      icon: 'support_agent',
      title: '24/7 Support',
      description: 'Round-the-clock customer support with dedicated teams for both marketers and promoters.',
      gradient: 'linear-gradient(135deg, #da5b25ff 0%, #98103bff 100%)'
    }
  ]);

  posterUrl = 'img/placeholders/how-to-video.jpg'; // replace with proper poster image
  videoUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

   ngOnInit(): void {
    this.videoUrl = this.buildYoutubeEmbedUrl('3dxS8th0WJo', 725);
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
