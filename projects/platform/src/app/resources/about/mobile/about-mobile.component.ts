import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../core/footer/footer.component';
import { HeaderComponent } from '../../core/header/header.component';
import { AboutComponent, Feature } from '../about.component';

type AboutSheet = 'mission' | 'feature' | 'workflow' | null;

interface MissionCard {
  icon: string;
  title: string;
  text: string;
  points: string[];
}

interface WorkflowStep {
  number: string;
  icon: string;
  title: string;
  text: string;
  tags: string[];
}

@Component({
  selector: 'app-about-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './about-mobile.component.html',
  styleUrls: ['./about-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutMobileComponent extends AboutComponent {
  readonly activeSheet = signal<AboutSheet>(null);
  readonly selectedFeature = signal<Feature | null>(null);
  readonly selectedWorkflow = signal<WorkflowStep | null>(null);

  readonly mobileStats = computed(() =>
    this.heroStatistics().map((stat) => ({
      ...stat,
      displayValue: `${stat.value}${stat.suffix || ''}`,
    })),
  );

  readonly missionCards: MissionCard[] = [
    {
      icon: 'public',
      title: 'Our vision',
      text: 'Make social commerce promotion measurable, trusted, and accessible for businesses and everyday promoters.',
      points: [
        'Open earning paths for micro-promoters',
        'Connect brands with real social audiences',
        'Make performance transparent from click to sale',
      ],
    },
    {
      icon: 'flag',
      title: 'Our mission',
      text: 'Help Nigerian businesses grow through verified promotion, storefront sales, and PPC tracking that both sides can trust.',
      points: [
        'Protect marketer budgets with tracking and fraud controls',
        'Reward promoters for valid activity',
        'Keep buyers, products, and referrals connected',
      ],
    },
  ];

  readonly proofStats = [
    { value: '10K+', label: 'Active promoters' },
    { value: '500+', label: 'Brands trust us' },
    { value: '50K+', label: 'Campaigns completed' },
    { value: 'NGN 100M+', label: 'Total payouts' },
  ];

  readonly workflowSteps: WorkflowStep[] = [
    {
      number: '01',
      icon: 'campaign',
      title: 'Create a campaign or product',
      text: 'Marketers publish campaigns or storefront products with clear budgets, rules, payout terms, and target outcomes.',
      tags: ['Budget rules', 'Product data', 'PPC ready'],
    },
    {
      number: '02',
      icon: 'link',
      title: 'Promoters share tracked links',
      text: 'Promoters use unique links and social-ready content, keeping captions and assets adaptable for each platform.',
      tags: ['Unique link', 'Social sharing', 'Promoter ID'],
    },
    {
      number: '03',
      icon: 'query_stats',
      title: 'MarketSpase tracks performance',
      text: 'Clicks, conversions, orders, referral source, device patterns, and fraud signals stay connected in the dashboard.',
      tags: ['Clicks', 'Orders', 'Fraud signals'],
    },
    {
      number: '04',
      icon: 'payments',
      title: 'Valid activity earns payout',
      text: 'Promoters earn from approved activity while marketers see the sales and conversion value behind every spend.',
      tags: ['Escrow', 'Commission', 'Analytics'],
    },
  ];

  openMissionSheet(): void {
    this.activeSheet.set('mission');
  }

  openFeature(feature: Feature): void {
    this.selectedFeature.set(feature);
    this.activeSheet.set('feature');
  }

  openWorkflow(step: WorkflowStep): void {
    this.selectedWorkflow.set(step);
    this.activeSheet.set('workflow');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  tone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-purple', 'tone-orange'][index % 4];
  }
}
