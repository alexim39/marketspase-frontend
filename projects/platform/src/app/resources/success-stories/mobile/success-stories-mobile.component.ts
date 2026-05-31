import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../core/footer/footer.component';
import { HeaderComponent } from '../../core/header/header.component';
import { SuccessStoriesComponent, SuccessStory } from '../success-stories.component';

type StorySheet = 'story' | 'filters' | 'industry' | null;

interface IndustryInsight {
  icon: string;
  title: string;
  text: string;
  stats: { value: string; label: string }[];
}

@Component({
  selector: 'app-success-stories-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './success-stories-mobile.component.html',
  styleUrls: ['./success-stories-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuccessStoriesMobileComponent extends SuccessStoriesComponent {
  readonly activeSheet = signal<StorySheet>(null);
  readonly selectedStory = signal<SuccessStory | null>(null);
  readonly selectedIndustry = signal<IndustryInsight | null>(null);

  readonly cleanedHeroStats = computed(() =>
    this.heroStatistics().map((stat) => ({
      ...stat,
      value: this.cleanText(stat.value),
    })),
  );

  readonly visibleStories = computed(() => this.filteredStories().slice(0, 4));

  readonly resultStats = [
    { icon: 'trending_up', value: '89%', label: 'Marketers see ROI within first month' },
    { icon: 'savings', value: 'NGN 2.3B+', label: 'Total promoter earnings tracked' },
    { icon: 'groups', value: '50K+', label: 'Active promoters earning monthly' },
    { icon: 'campaign', value: '150K+', label: 'Successful campaigns completed' },
  ];

  readonly industryInsights: IndustryInsight[] = [
    {
      icon: 'storefront',
      title: 'E-commerce and retail',
      text: 'Stores use promoters to drive product discovery, referral clicks, and buyer orders.',
      stats: [
        { value: '45%', label: 'Average sales lift' },
        { value: '3.2x', label: 'Higher engagement' },
      ],
    },
    {
      icon: 'school',
      title: 'Education and services',
      text: 'Brands reach parents, students, and communities through trusted social recommendations.',
      stats: [
        { value: '68%', label: 'Enrollment lift' },
        { value: '2.5x', label: 'Qualified leads' },
      ],
    },
    {
      icon: 'health_and_safety',
      title: 'Health and wellness',
      text: 'Wellness businesses build trust through measurable campaigns and local promoter reach.',
      stats: [
        { value: '52%', label: 'Appointment lift' },
        { value: '4.1x', label: 'Trust score' },
      ],
    },
  ];

  openStorySheet(story: SuccessStory): void {
    this.selectedStory.set(story);
    this.activeSheet.set('story');
  }

  openFilterSheet(): void {
    this.activeSheet.set('filters');
  }

  openIndustrySheet(industry: IndustryInsight): void {
    this.selectedIndustry.set(industry);
    this.activeSheet.set('industry');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  cleanText(value: string | undefined): string {
    return (value || '').replace(/â‚¦/g, 'NGN ').replace(/\s+/g, ' ').trim();
  }

  storyInitials(story: SuccessStory): string {
    return story.user.name
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
