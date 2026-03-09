// community.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HeaderComponent } from '../core/header/header.component';
import { FooterComponent } from '../core/footer/footer.component';

interface CommunityStat {
  value: string;
  label: string;
  icon: string;
}

interface DiscussionTopic {
  id: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    role: 'marketer' | 'promoter' | 'expert';
  };
  category: string;
  replies: number;
  views: number;
  lastActive: string;
  isPinned?: boolean;
  isHot?: boolean;
}

interface SuccessTip {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  readTime: string;
  likes: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  type: 'workshop' | 'ama' | 'webinar' | 'networking';
  host: string;
  attendees: number;
  image: string;
}

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './community.component.html',
  styleUrls: ['./community.component.scss']
})
export class CommunityComponent {
  activeTab = signal<'discussions' | 'tips' | 'events' | 'mentors'>('discussions');

  heroStatistics = signal<CommunityStat[]>([
    { value: '50K+', label: 'Community Members', icon: 'groups' },
    { value: '10K+', label: 'Daily Discussions', icon: 'forum' },
    { value: '95%', label: 'Questions Answered', icon: 'help' },
    { value: '500+', label: 'Expert Mentors', icon: 'school' }
  ]);

  categories = signal([
    {
      id: 'all',
      name: 'All Discussions',
      description: 'Browse all community conversations',
      icon: 'forum',
      count: 12453,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
      id: 'marketers',
      name: 'Marketers',
      description: 'Strategies, campaign tips, and marketing insights',
      icon: 'campaign',
      count: 4532,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
      id: 'promoters',
      name: 'Promoters',
      description: 'Earning tips, audience growth, and success stories',
      icon: 'groups',
      count: 6789,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    {
      id: 'experts',
      name: 'Expert Advice',
      description: 'Learn from top performers and industry experts',
      icon: 'star',
      count: 1132,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    }
  ]);

  hotTopics = signal<DiscussionTopic[]>([
    {
      id: '1',
      title: 'How I increased my campaign earnings from ₦50K to ₦500K monthly - My complete strategy',
      author: {
        name: 'Adeola Johnson',
        avatar: 'img/avatar.png',
        role: 'promoter'
      },
      category: 'promoters',
      replies: 234,
      views: 12543,
      lastActive: '2 hours ago',
      isHot: true,
      isPinned: true
    },
    {
      id: '2',
      title: 'WhatsApp Status vs Instagram Stories: Which gives better ROI for small businesses?',
      author: {
        name: 'Chinedu Okoro',
        avatar: 'img/avatar.png',
        role: 'marketer'
      },
      category: 'marketers',
      replies: 156,
      views: 8765,
      lastActive: '5 hours ago',
      isHot: true
    },
    {
      id: '3',
      title: 'Complete guide: How to verify campaign proofs and avoid disputes',
      author: {
        name: 'Bisi Adekunle',
        avatar: 'img/avatar.png',
        role: 'expert'
      },
      category: 'experts',
      replies: 89,
      views: 5432,
      lastActive: '1 day ago',
      isPinned: true
    },
    {
      id: '4',
      title: 'What time of day gives the highest view count for WhatsApp Status?',
      author: {
        name: 'Tunde Williams',
        avatar: 'img/avatar.png',
        role: 'promoter'
      },
      category: 'promoters',
      replies: 67,
      views: 4321,
      lastActive: '3 hours ago'
    }
  ]);

  successTips = signal<SuccessTip[]>([
    {
      id: '1',
      title: '5 Types of Content That Get 100+ Views Every Time',
      excerpt: 'After analyzing 1000+ successful campaigns, here are the content formats that consistently perform best on WhatsApp Status.',
      author: {
        name: 'Grace Emmanuel',
        avatar: 'img/avatar.png',
        role: 'Top Promoter'
      },
      category: 'Content Strategy',
      readTime: '5 min',
      likes: 342
    },
    {
      id: '2',
      title: 'How to Build Trust With Your WhatsApp Audience',
      excerpt: 'Trust is the currency of WhatsApp marketing. Learn the proven techniques to build authentic connections with your viewers.',
      author: {
        name: 'Michael Okafor',
        avatar: 'img/avatar.png',
        role: 'Marketing Expert'
      },
      category: 'Audience Growth',
      readTime: '7 min',
      likes: 289
    },
    {
      id: '3',
      title: 'The Science of Campaign Timing: When to Post for Maximum Views',
      excerpt: 'Data-driven insights on the best times to post campaigns for different audience demographics.',
      author: {
        name: 'Sarah Nnamdi',
        avatar: 'img/avatar.png',
        role: 'Data Analyst'
      },
      category: 'Analytics',
      readTime: '4 min',
      likes: 412
    },
    {
      id: '4',
      title: 'From 0 to 10,000 Views: A Beginner\'s Guide to Growing Your WhatsApp Status Audience',
      excerpt: 'Step-by-step strategies for new promoters to build a substantial viewer base quickly.',
      author: {
        name: 'James Akpan',
        avatar: 'img/avatar.png',
        role: 'Growth Expert'
      },
      category: 'Growth Hacks',
      readTime: '6 min',
      likes: 567
    }
  ]);

  upcomingEvents = signal<Event[]>([
    {
      id: '1',
      title: 'WhatsApp Marketing Masterclass',
      description: 'Learn advanced strategies for maximizing campaign ROI from industry experts',
      date: 'March 25, 2024',
      time: '3:00 PM WAT',
      type: 'workshop',
      host: 'MarketSpase Academy',
      attendees: 234,
      image: 'img/avatar.png',
    },
    {
      id: '2',
      title: 'AMA with Top Earner: How I Make ₦500K/month',
      description: 'Live Q&A session with our top promoter of the year. Ask anything about building a promoter career.',
      date: 'March 28, 2024',
      time: '5:00 PM WAT',
      type: 'ama',
      host: 'Adeola Johnson',
      attendees: 567,
      image: 'img/avatar.png',
    },
    {
      id: '3',
      title: 'Community Networking Hour',
      description: 'Connect with fellow marketers and promoters, share experiences, and build valuable partnerships.',
      date: 'April 2, 2024',
      time: '4:00 PM WAT',
      type: 'networking',
      host: 'Community Team',
      attendees: 89,
      image: 'img/avatar.png',
    }
  ]);

  getCategoryIcon(type: string): string {
    switch (type) {
      case 'workshop': return 'school';
      case 'ama': return 'question_answer';
      case 'webinar': return 'videocam';
      case 'networking': return 'people';
      default: return 'event';
    }
  }

  getCategoryColor(type: string): string {
    switch (type) {
      case 'workshop': return '#667eea';
      case 'ama': return '#f56565';
      case 'webinar': return '#48bb78';
      case 'networking': return '#9f7aea';
      default: return '#718096';
    }
  }

  getRoleBadgeColor(role: string): string {
    switch (role) {
      case 'expert': return '#fbbf24';
      case 'marketer': return '#667eea';
      case 'promoter': return '#48bb78';
      default: return '#718096';
    }
  }

  joinDiscussion(topicId: string): void {
    console.log('Joining discussion:', topicId);
    // Navigate to discussion thread
  }

  readTip(tipId: string): void {
    console.log('Reading tip:', tipId);
    // Navigate to full tip
  }

  registerForEvent(eventId: string): void {
    console.log('Registering for event:', eventId);
    // Open event registration modal
  }

  joinCommunity(): void {
    console.log('Joining community');
    // Navigate to community signup
  }

  startDiscussion(): void {
    console.log('Starting new discussion');
    // Open new discussion form
  }
}