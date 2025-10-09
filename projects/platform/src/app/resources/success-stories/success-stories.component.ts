// success-stories.component.ts
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

interface SuccessStory {
  id: string;
  title: string;
  excerpt: string;
  fullStory: string;
  category: 'marketer' | 'promoter' | 'enterprise';
  industry?: string;
  results: {
    metric: string;
    value: string;
    change: string;
  }[];
  featured: boolean;
  heroImage: string;
  logo: string;
  user: {
    name: string;
    role: string;
    company: string;
    avatar: string;
  };
  highlights: string[];
  videoUrl?: string;
  readTime: string;
  publishDate: string;
}

interface Statistic {
  value: string;
  label: string;
  icon: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
  gradient: string;
}

@Component({
  selector: 'app-success-stories',
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
  templateUrl: './success-stories.component.html',
  styleUrls: ['./success-stories.component.scss']
})
export class SuccessStoriesComponent {
  activeCategory = signal<'all' | 'marketer' | 'promoter' | 'enterprise'>('all');

  heroStatistics = signal<Statistic[]>([
    { value: '500+', label: 'Success Stories', icon: 'stars' },
    { value: '₦2.3B+', label: 'Total Earnings', icon: 'savings' },
    { value: '98%', label: 'Success Rate', icon: 'trending_up' },
    { value: '50K+', label: 'Lives Impacted', icon: 'groups' }
  ]);

  categories = signal<Category[]>([
    {
      id: 'all',
      name: 'All Stories',
      description: 'Explore all success stories from our diverse community',
      icon: 'auto_stories',
      count: 28,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'marketer',
      name: 'Marketers',
      description: 'Businesses achieving remarkable marketing results',
      icon: 'campaign',
      count: 12,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'promoter',
      name: 'Promoters',
      description: 'Individuals building sustainable income streams',
      icon: 'groups',
      count: 14,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Large organizations transforming their marketing',
      icon: 'business',
      count: 6,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ]);

  successStories = signal<SuccessStory[]>([
    {
      id: 'adeola-success',
      title: 'From ₦50,000 to ₦500,000 Monthly: How Adeola Built a WhatsApp Marketing Empire',
      excerpt: 'Adeola transformed her small business by leveraging WhatsApp status promotions, achieving 10x growth in just 6 months.',
      fullStory: 'Full story content would go here...',
      category: 'marketer',
      industry: 'Fashion & Retail',
      results: [
        { metric: 'Monthly Revenue', value: '₦500K', change: '+900%' },
        { metric: 'Customer Reach', value: '50K+', change: '+400%' },
        { metric: 'ROI', value: '350%', change: '+250%' },
        { metric: 'Campaign Success', value: '95%', change: '+45%' }
      ],
      featured: true,
      heroImage: '/assets/stories/adeola-hero.jpg',
      logo: '/assets/stories/adeola-logo.png',
      user: {
        name: 'Adeola Johnson',
        role: 'Founder & CEO',
        company: 'Nigerian Fashion Hub',
        avatar: '/assets/stories/adeola-avatar.jpg'
      },
      highlights: [
        'Achieved 10x revenue growth in 6 months',
        'Built a community of 50,000+ engaged customers',
        'Reduced customer acquisition cost by 70%',
        'Expanded to 3 new cities through WhatsApp reach'
      ],
      videoUrl: 'https://youtube.com/embed/example',
      readTime: '8 min',
      publishDate: 'March 15, 2024'
    },
    {
      id: 'chinedu-journey',
      title: 'University Student Earns ₦2.8M in 12 Months Promoting on WhatsApp',
      excerpt: 'Chinedu balanced his studies while building a substantial income stream through strategic campaign selection.',
      fullStory: 'Full story content would go here...',
      category: 'promoter',
      industry: 'Education',
      results: [
        { metric: 'Total Earnings', value: '₦2.8M', change: '+2800%' },
        { metric: 'Campaigns Completed', value: '156', change: '+1400%' },
        { metric: 'Success Rate', value: '98%', change: '+18%' },
        { metric: 'Rating Score', value: '4.9/5', change: '+0.4' }
      ],
      featured: false,
      heroImage: '/assets/stories/chinedu-hero.jpg',
      logo: '/assets/stories/chinedu-logo.png',
      user: {
        name: 'Chinedu Okoro',
        role: 'Student & Promoter',
        company: 'University of Lagos',
        avatar: '/assets/stories/chinedu-avatar.jpg'
      },
      highlights: [
        'Paid tuition fees and living expenses',
        'Built a reputation as a top-rated promoter',
        'Received premium campaign invitations',
        'Mentored other student promoters'
      ],
      readTime: '6 min',
      publishDate: 'February 28, 2024'
    },
    {
      id: 'bisi-enterprise',
      title: 'Enterprise Brand Sees 300% ROI with WhatsApp Status Campaigns',
      excerpt: 'How a leading FMCG company transformed their digital marketing strategy with MarketSpase.',
      fullStory: 'Full story content would go here...',
      category: 'enterprise',
      industry: 'FMCG',
      results: [
        { metric: 'Campaign ROI', value: '300%', change: '+200%' },
        { metric: 'Brand Awareness', value: '45%', change: '+25%' },
        { metric: 'Customer Engagement', value: '3.2x', change: '+220%' },
        { metric: 'Cost per Acquisition', value: '-60%', change: '-40%' }
      ],
      featured: true,
      heroImage: '/assets/stories/bisi-hero.jpg',
      logo: '/assets/stories/bisi-logo.png',
      user: {
        name: 'Bisi Adekunle',
        role: 'Marketing Director',
        company: 'Prime Consumer Goods',
        avatar: '/assets/stories/bisi-avatar.jpg'
      },
      highlights: [
        'Achieved highest ROI in company history',
        'Reached 2 million unique users',
        'Reduced digital ad spend by 40%',
        'Increased brand loyalty significantly'
      ],
      readTime: '10 min',
      publishDate: 'April 2, 2024'
    },
    {
      id: 'tunde-side-hustle',
      title: 'Banker Turns Side Hustle into ₦150K Monthly Passive Income',
      excerpt: 'Tunde discovered how to monetize his WhatsApp network while maintaining his banking career.',
      fullStory: 'Full story content would go here...',
      category: 'promoter',
      industry: 'Finance',
      results: [
        { metric: 'Monthly Income', value: '₦150K', change: '+1500%' },
        { metric: 'Weekly Time Spent', value: '5 hours', change: '-80%' },
        { metric: 'Network Size', value: '2.5K', change: '+400%' },
        { metric: 'Campaign Efficiency', value: '92%', change: '+32%' }
      ],
      featured: false,
      heroImage: '/assets/stories/tunde-hero.jpg',
      logo: '/assets/stories/tunde-logo.png',
      user: {
        name: 'Tunde Williams',
        role: 'Bank Manager',
        company: 'Leading Commercial Bank',
        avatar: '/assets/stories/tunde-avatar.jpg'
      },
      highlights: [
        'Created sustainable passive income stream',
        'Maintained full-time banking career',
        'Built valuable digital marketing skills',
        'Increased professional network significantly'
      ],
      readTime: '5 min',
      publishDate: 'January 12, 2024'
    }
  ]);

  filteredStories = signal<SuccessStory[]>([]);
  featuredStory = signal<SuccessStory | null>(null);

  constructor() {
    this.updateFilteredStories();
    this.setFeaturedStory();
  }

  setActiveCategory(category: 'all' | 'marketer' | 'promoter' | 'enterprise'): void {
    this.activeCategory.set(category);
    this.updateFilteredStories();
  }

  private updateFilteredStories(): void {
    if (this.activeCategory() === 'all') {
      this.filteredStories.set(this.successStories());
    } else {
      const filtered = this.successStories().filter(story => story.category === this.activeCategory());
      this.filteredStories.set(filtered);
    }
  }

  private setFeaturedStory(): void {
    const featured = this.successStories().find(story => story.featured);
    this.featuredStory.set(featured || null);
  }

  getCategoryLabel(category: string): string {
    switch (category) {
      case 'marketer': return 'Marketer Success';
      case 'promoter': return 'Promoter Success';
      case 'enterprise': return 'Enterprise Success';
      default: return 'Success Story';
    }
  }

  openStory(storyId: string): void {
    // Navigate to individual story page or open modal
    console.log('Opening story:', storyId);
    // this.router.navigate(['/success-stories', storyId]);
  }

  playVideo(videoUrl: string): void {
    // Open video in modal or redirect to video page
    window.open(videoUrl, '_blank');
  }
}