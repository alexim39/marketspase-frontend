import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../core/footer/footer.component';
import { HeaderComponent } from '../../core/header/header.component';
import { CommunityComponent, CommunityEvent, DiscussionTopic, SuccessTip } from '../community.component';

type CommunitySheet = 'topic' | 'tip' | 'event' | 'benefits' | null;
type CommunitySection = 'discussions' | 'tips' | 'events' | 'mentors';

interface MentorCard {
  name: string;
  role: string;
  bio: string;
  stats: { value: string; label: string }[];
}

@Component({
  selector: 'app-community-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './community-mobile.component.html',
  styleUrls: ['./community-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunityMobileComponent extends CommunityComponent {
  readonly activeSection = signal<CommunitySection>('discussions');
  readonly activeSheet = signal<CommunitySheet>(null);
  readonly selectedTopic = signal<DiscussionTopic | null>(null);
  readonly selectedTip = signal<SuccessTip | null>(null);
  readonly selectedEvent = signal<CommunityEvent | null>(null);

  readonly cleanedStats = computed(() =>
    this.heroStatistics().map((stat) => ({
      ...stat,
      value: this.cleanText(stat.value),
    })),
  );

  readonly communityBenefits = [
    {
      icon: 'forum',
      title: 'Active discussions',
      text: 'Learn from daily conversations about campaign setup, product promotion, storefront selling, and payout growth.',
      stats: ['10K+ daily posts', '95% response rate'],
    },
    {
      icon: 'school',
      title: 'Expert mentorship',
      text: 'Get practical guidance from experienced marketers, promoters, and product sellers.',
      stats: ['500+ mentors', 'Free sessions'],
    },
    {
      icon: 'emoji_events',
      title: 'Proven playbooks',
      text: 'Find repeatable tactics from people already growing with MarketSpase.',
      stats: ['1,000+ cases', 'Weekly spotlights'],
    },
  ];

  readonly mentors: MentorCard[] = [
    {
      name: 'Grace Emmanuel',
      role: 'Top Promoter',
      bio: 'Helps promoters build trust with their audience and pick better product/campaign opportunities.',
      stats: [
        { value: '1.2K+', label: 'Mentees' },
        { value: '98%', label: 'Success rate' },
      ],
    },
    {
      name: 'Michael Okafor',
      role: 'Marketing Expert',
      bio: 'Guides marketers on campaign structure, social copy, and performance measurement.',
      stats: [
        { value: '300+', label: 'Campaigns' },
        { value: '4.9/5', label: 'Rating' },
      ],
    },
    {
      name: 'Sarah Nnamdi',
      role: 'Analytics Specialist',
      bio: 'Teaches users how to read conversion trends and improve weak promotion performance.',
      stats: [
        { value: '15K+', label: 'Students' },
        { value: '4.8/5', label: 'Rating' },
      ],
    },
  ];

  readonly visibleTopics = computed(() => this.hotTopics().slice(0, 4));
  readonly visibleTips = computed(() => this.successTips().slice(0, 4));
  readonly visibleEvents = computed(() => this.upcomingEvents().slice(0, 3));

  selectSection(section: CommunitySection): void {
    this.activeSection.set(section);
  }

  openTopic(topic: DiscussionTopic): void {
    this.selectedTopic.set(topic);
    this.activeSheet.set('topic');
  }

  openTip(tip: SuccessTip): void {
    this.selectedTip.set(tip);
    this.activeSheet.set('tip');
  }

  openEvent(event: CommunityEvent): void {
    this.selectedEvent.set(event);
    this.activeSheet.set('event');
  }

  openBenefitsSheet(): void {
    this.activeSheet.set('benefits');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  cleanText(value: string | undefined): string {
    return (value || '').replace(/â‚¦/g, 'NGN ').replace(/â€¢/g, '·').replace(/\s+/g, ' ').trim();
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  tone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-purple', 'tone-orange'][index % 4];
  }
}
