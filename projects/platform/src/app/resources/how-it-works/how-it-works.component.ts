// how-it-works.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  features: string[];
  duration?: string;
}

interface UserRole {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  benefits: string[];
  idealFor: string[];
}

interface FeatureHighlight {
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
      description: 'Businesses and individuals looking to market their products or services through authentic WhatsApp marketing.',
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
      description: 'Individuals who want to earn money by sharing campaigns on their WhatsApp Status.',
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
        'Anyone with WhatsApp'
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
      description: 'Promoters share the watermarked campaign content on their WhatsApp Status for 24 hours. Marketers can track performance in real-time as proofs are submitted.',
      icon: 'share',
      //image: '/img/process/share-status.jpg',
      features: ['Easy Sharing', 'Real-time Tracking', 'Watermark Protection', '24-hour Duration']
    },
    {
      number: '04',
      title: 'Submit Proof, Verify & Earn',
      description: 'After 23 hours, you are free to submit screenshot/screen record of promotion. Our AI system verifies campaign completion, view counts promotion ID, date and time. Payments are automatically released to promoters wallet, and marketers get detailed performance reports.',
      icon: 'verified',
      //image: '/img/process/verification.jpg',
      features: ['AI Verification', 'Auto Payments', 'Performance Reports', 'Earnings Tracking']
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
      icon: 'security',
      title: 'Secure Watermarking',
      description: 'Automatic unique watermarking for each campaign to prevent fraud and ensure authenticity.',
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)'
    },
    {
      icon: 'auto_awesome',
      title: 'Automated Verification',
      description: 'Advanced computer vision and AI verify campaign posts with 99.8% accuracy in real-time.',
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
}