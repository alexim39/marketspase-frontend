import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DeviceService } from '@shared/services';

type SkeletonVariant =
  | 'about'
  | 'contact'
  | 'features'
  | 'solution'
  | 'how'
  | 'faq'
  | 'careers'
  | 'community'
  | 'success'
  | 'benefits';

type SkeletonSectionKind =
  | 'metric-grid'
  | 'card-grid'
  | 'steps'
  | 'form-split'
  | 'accordion'
  | 'story-feed'
  | 'job-list'
  | 'comparison'
  | 'cta';

interface SkeletonSection {
  id: string;
  kind: SkeletonSectionKind;
  count: number;
}

interface SkeletonProfile {
  variant: SkeletonVariant;
  heroPanel: 'metrics' | 'visual' | 'form' | 'search' | 'story';
  heroCards: number;
  titleLines: number;
  sections: SkeletonSection[];
}

const DEFAULT_PROFILE: SkeletonProfile = {
  variant: 'about',
  heroPanel: 'metrics',
  heroCards: 4,
  titleLines: 2,
  sections: [
    { id: 'about-metrics', kind: 'metric-grid', count: 4 },
    { id: 'about-values', kind: 'card-grid', count: 4 },
    { id: 'about-steps', kind: 'steps', count: 4 },
    { id: 'about-cta', kind: 'cta', count: 1 },
  ],
};

const PROFILES: Record<SkeletonVariant, SkeletonProfile> = {
  about: DEFAULT_PROFILE,
  contact: {
    variant: 'contact',
    heroPanel: 'form',
    heroCards: 3,
    titleLines: 2,
    sections: [
      { id: 'contact-form', kind: 'form-split', count: 1 },
      { id: 'contact-support', kind: 'card-grid', count: 3 },
      { id: 'contact-faq', kind: 'accordion', count: 4 },
    ],
  },
  features: {
    variant: 'features',
    heroPanel: 'visual',
    heroCards: 3,
    titleLines: 2,
    sections: [
      { id: 'features-grid', kind: 'card-grid', count: 6 },
      { id: 'features-compare', kind: 'comparison', count: 4 },
      { id: 'features-cta', kind: 'cta', count: 1 },
    ],
  },
  solution: {
    variant: 'solution',
    heroPanel: 'metrics',
    heroCards: 3,
    titleLines: 2,
    sections: [
      { id: 'solution-kpis', kind: 'metric-grid', count: 3 },
      { id: 'solution-cards', kind: 'card-grid', count: 4 },
      { id: 'solution-steps', kind: 'steps', count: 4 },
    ],
  },
  how: {
    variant: 'how',
    heroPanel: 'visual',
    heroCards: 4,
    titleLines: 2,
    sections: [
      { id: 'how-steps', kind: 'steps', count: 5 },
      { id: 'how-cards', kind: 'card-grid', count: 3 },
      { id: 'how-cta', kind: 'cta', count: 1 },
    ],
  },
  faq: {
    variant: 'faq',
    heroPanel: 'search',
    heroCards: 2,
    titleLines: 1,
    sections: [
      { id: 'faq-search', kind: 'accordion', count: 7 },
      { id: 'faq-support', kind: 'card-grid', count: 3 },
    ],
  },
  careers: {
    variant: 'careers',
    heroPanel: 'metrics',
    heroCards: 3,
    titleLines: 2,
    sections: [
      { id: 'careers-values', kind: 'card-grid', count: 4 },
      { id: 'careers-jobs', kind: 'job-list', count: 4 },
      { id: 'careers-cta', kind: 'cta', count: 1 },
    ],
  },
  community: {
    variant: 'community',
    heroPanel: 'story',
    heroCards: 3,
    titleLines: 2,
    sections: [
      { id: 'community-feed', kind: 'story-feed', count: 4 },
      { id: 'community-topics', kind: 'card-grid', count: 4 },
      { id: 'community-cta', kind: 'cta', count: 1 },
    ],
  },
  success: {
    variant: 'success',
    heroPanel: 'story',
    heroCards: 2,
    titleLines: 2,
    sections: [
      { id: 'success-stories', kind: 'story-feed', count: 3 },
      { id: 'success-metrics', kind: 'metric-grid', count: 4 },
      { id: 'success-cta', kind: 'cta', count: 1 },
    ],
  },
  benefits: {
    variant: 'benefits',
    heroPanel: 'metrics',
    heroCards: 4,
    titleLines: 2,
    sections: [
      { id: 'benefits-grid', kind: 'card-grid', count: 6 },
      { id: 'benefits-compare', kind: 'comparison', count: 4 },
      { id: 'benefits-cta', kind: 'cta', count: 1 },
    ],
  },
};

@Component({
  selector: 'app-about-skeleton',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-skeleton.component.html',
  styleUrls: ['./loading-skeleton.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutSkeletonComponent {
  private readonly deviceService = inject(DeviceService);

  readonly targetUrl = input('');

  protected readonly pageProfile = computed(() => {
    const variant = this.resolveVariant(this.targetUrl());
    return PROFILES[variant];
  });

  protected readonly isMobileExperience = computed(() => {
    const type = this.deviceService.type();
    return type === 'mobile' || type === 'tablet';
  });

  protected readonly layoutClass = computed(() => (this.isMobileExperience() ? 'is-mobile' : 'is-desktop'));

  protected readonly heroCards = computed(() => this.range(this.pageProfile().heroCards));
  protected readonly titleLines = computed(() => this.range(this.pageProfile().titleLines));
  protected readonly sections = computed(() => this.pageProfile().sections);

  protected range(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  private resolveVariant(url: string): SkeletonVariant {
    const normalized = (url || '').split('?')[0].split('#')[0].toLowerCase();

    if (normalized.includes('/contact')) return 'contact';
    if (normalized.includes('/features')) return 'features';
    if (normalized.includes('/solutions/')) return 'solution';
    if (normalized.includes('/how-it-works')) return 'how';
    if (normalized.includes('/faqs') || normalized.includes('/help-center')) return 'faq';
    if (normalized.includes('/careers')) return 'careers';
    if (normalized.includes('/community')) return 'community';
    if (normalized.includes('/success-stories')) return 'success';
    if (normalized.includes('/benefits')) return 'benefits';

    return 'about';
  }
}
