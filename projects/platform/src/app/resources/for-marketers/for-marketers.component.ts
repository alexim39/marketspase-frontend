// for-marketers.component.ts
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

interface Feature {
  icon: string;
  title: string;
  description: string;
  benefits: string[];
  gradient: string;
}

interface UseCase {
  industry: string;
  title: string;
  description: string;
  results: {
    metric: string;
    value: string;
    change: string;
  }[];
  image: string;
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
  results: {
    metric: string;
    value: string;
  }[];
}

@Component({
  selector: 'app-for-marketers',
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
  templateUrl: './for-marketers.component.html',
  styleUrls: ['./for-marketers.component.scss']
})
export class ForMarketersComponent {
  features = signal<Feature[]>([
    {
      icon: 'target',
      title: 'Smart Audience Targeting',
      description: 'Reach your ideal customers with precision targeting based on demographics, interests, and location.',
      benefits: [
        'Demographic-based targeting',
        'Interest and behavior matching',
        'Location-specific campaigns',
        'AI-powered audience selection'
      ],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      icon: 'analytics',
      title: 'Real-time Performance Analytics',
      description: 'Track campaign performance with live metrics, view counts, and engagement analytics.',
      benefits: [
        'Live view count tracking',
        'Engagement rate monitoring',
        'ROI and performance insights',
        'Exportable reports'
      ],
      gradient: 'linear-gradient(135deg, #83368cff 0%, #f5576c 100%)'
    },
    {
      icon: 'verified',
      title: 'AI-Powered Verification',
      description: 'Automated verification ensures your campaigns are completed as promised before payments are released.',
      benefits: [
        'Automated proof verification',
        '24-hour duration tracking',
        'Fraud detection system',
        'Quality assurance'
      ],
      gradient: 'linear-gradient(135deg, #4facfe 0%, #10888eff 100%)'
    },
    {
      icon: 'watermark',
      title: 'Secure Content Protection',
      description: 'Automatic watermarking and content protection to safeguard your brand assets.',
      benefits: [
        'Automatic watermarking',
        'Content usage tracking',
        'Brand protection',
        'Secure asset management'
      ],
      gradient: 'linear-gradient(135deg, #29bd5aff 0%, #107160ff 100%)'
    },
    {
      icon: 'auto_awesome',
      title: 'Campaign Optimization',
      description: 'AI-driven insights and recommendations to optimize your campaigns for better performance.',
      benefits: [
        'Performance optimization tips',
        'A/B testing capabilities',
        'Budget optimization',
        'Best practice recommendations'
      ],
      gradient: 'linear-gradient(135deg, #da5b25ff 0%, #5d5005ff 100%)'
    },
    {
      icon: 'support_agent',
      title: 'Dedicated Marketer Support',
      description: 'Get expert guidance and support from our dedicated marketer success team.',
      benefits: [
        'Dedicated account manager',
        'Campaign strategy support',
        '24/7 technical support',
        'Best practice guidance'
      ],
      gradient: 'linear-gradient(135deg, #8570faff 0%, #5d5005ff 100%)'
    }
  ]);

  useCases = signal<UseCase[]>([
    {
      industry: 'E-commerce',
      title: 'Boost Sales for Online Stores',
      description: 'Drive traffic and sales for e-commerce businesses through authentic WhatsApp recommendations from trusted promoters.',
      results: [
        { metric: 'Sales Increase', value: '45%', change: '+25%' },
        { metric: 'Customer Acquisition', value: '3.2x', change: '+120%' },
        { metric: 'ROI', value: '350%', change: '+150%' },
        { metric: 'Engagement Rate', value: '28%', change: '+18%' }
      ],
      image: '/img/resources/use-cases/ecommerce.png'
    },
    {
      industry: 'Real Estate',
      title: 'Generate Quality Leads',
      description: 'Reach potential home buyers and renters through personal networks with high-intent real estate promotions.',
      results: [
        { metric: 'Lead Generation', value: '68%', change: '+38%' },
        { metric: 'Cost per Lead', value: '-60%', change: '-40%' },
        { metric: 'Conversion Rate', value: '22%', change: '+12%' },
        { metric: 'Quality Score', value: '4.8/5', change: '+1.2' }
      ],
      image: '/img/resources/use-cases/real-estate.png'
    },
    {
      industry: 'Education',
      title: 'Drive Course Enrollment',
      description: 'Promote educational courses and programs to targeted student audiences through trusted academic promoters.',
      results: [
        { metric: 'Enrollment Rate', value: '52%', change: '+27%' },
        { metric: 'Student Reach', value: '25K+', change: '+15K' },
        { metric: 'Cost per Enrollment', value: '-55%', change: '-25%' },
        { metric: 'Satisfaction', value: '94%', change: '+14%' }
      ],
      image: '/img/resources/use-cases/education.png'
    }
  ]);

  pricingTiers = signal<PricingTier[]>([
   /*  {
      name: 'Starter',
      price: '₦5,000',
      period: 'campaign',
      description: 'Perfect for small businesses and testing',
      features: [
        'Up to 5 promoters per campaign',
        'Basic analytics dashboard',
        'Standard support',
        'Manual campaign approval',
        '7-day campaign duration'
      ],
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }, */
   /*  {
      name: 'Professional',
      price: '₦25,000',
      period: 'month',
      description: 'Ideal for growing businesses',
      features: [
        'Up to 50 promoters per campaign',
        'Advanced analytics & insights',
        'Priority support',
        'AI-powered verification',
        'Unlimited campaign duration',
        'A/B testing capabilities'
      ],
      popular: true,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    }, */
   /*  {
      name: 'Enterprise',
      price: 'Custom',
      period: 'month',
      description: 'For large organizations with custom needs',
      features: [
        'Unlimited promoters',
        'Enterprise analytics dashboard',
        'Dedicated account manager',
        'Custom AI models',
        'API access',
        'White-label solutions',
        'SLA guarantee'
      ],
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    } */
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
  ]);

  testimonials = signal<Testimonial[]>([
    {
      name: 'Adeola Johnson',
      role: 'Marketing Director',
      company: 'Nigerian Fashion Hub',
      content: 'MarketSpase transformed our digital marketing strategy. We achieved 3x higher engagement compared to traditional social media ads, and the authentic recommendations drove real sales.',
      avatar: '/img/resources/avatar/adeola.png',
      results: [
        { metric: 'ROI', value: '320%' },
        { metric: 'Engagement', value: '3.2x' },
        { metric: 'Cost Savings', value: '65%' }
      ]
    },
    {
      name: 'Chinedu Okoro',
      role: 'CEO',
      company: 'TechStart NG',
      content: 'The targeting capabilities are incredible. We reached exactly the right audience for our SaaS product, and the personal touch of WhatsApp made all the difference in conversion rates.',
      avatar: '/img/resources/avatar/chinedu.png',
      results: [
        { metric: 'Conversion', value: '28%' },
        { metric: 'Lead Quality', value: '4.7/5' },
        { metric: 'Cost per Lead', value: '-55%' }
      ]
    },
    {
      name: 'Bisi Adekunle',
      role: 'Head of Marketing',
      company: 'EduLearn Academy',
      content: 'As an education platform, trust is everything. MarketSpase helped us build authentic connections with potential students through trusted promoters in academic communities.',
      avatar: '/img/resources/avatar/bisi.png',
      results: [
        { metric: 'Enrollment', value: '+45%' },
        { metric: 'Trust Score', value: '4.9/5' },
        { metric: 'Student Reach', value: '50K+' }
      ]
    }
  ]);

  scrollToFeatures(): void {
    const element = document.querySelector('.features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // public Facebook reel/video URL (must be public)
  readonly fbUrl = 'https://web.facebook.com/reel/4109263909219907';
  posterUrl = 'img/placeholders/how-to-video.jpg'; // replace with proper poster image
  videoUrl!: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit(): void {
    // Preload video URL but do not show player until clicked
    const plugin = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(this.fbUrl)}&show_text=0&autoplay=1`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(plugin);
  }

}