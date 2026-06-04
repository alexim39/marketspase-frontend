import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../core/header/header.component';
import { FooterComponent } from '../../core/footer/footer.component';
import { FeatureHighlight, HowItWorksComponent, ProcessStep, UserRole } from '../how-it-works.component';

type HowItWorksSheet = 'role' | 'step' | 'feature' | 'video' | null;
type RoleGuide = 'marketer' | 'promoter';

@Component({
  selector: 'app-how-it-works-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './how-it-works-mobile.component.html',
  styleUrls: ['./how-it-works-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksMobileComponent extends HowItWorksComponent {
  readonly activeSheet = signal<HowItWorksSheet>(null);
  readonly selectedRole = signal<UserRole | null>(null);
  readonly selectedStep = signal<ProcessStep | null>(null);
  readonly selectedFeature = signal<FeatureHighlight | null>(null);
  readonly selectedGuide = signal<RoleGuide>('marketer');

  readonly keyStats = [
    { value: '4', label: 'Simple steps' },
    { value: 'PPC', label: 'Tracked model' },
    { value: 'Live', label: 'Click tracking' },
    { value: 'NGN 0', label: 'Start cost' },
  ];

  readonly marketerGuide = [
    {
      icon: 'ads_click',
      title: 'Create a campaign',
      text: 'Add your product, campaign goal, budget, and payout rules so promoters know exactly what to promote.',
    },
    {
      icon: 'groups',
      title: 'Let promoters apply',
      text: 'MarketSpase recommends suitable promoters and keeps campaign activity visible from your dashboard.',
    },
    {
      icon: 'query_stats',
      title: 'Track results',
      text: 'Follow clicks, conversions, spend, and promoter quality signals before spending more budget.',
    },
  ];

  readonly promoterGuide = [
    {
      icon: 'link',
      title: 'Pick a good promotion',
      text: 'Choose offers that match your audience, copy your unique link, and use approved content only.',
    },
    {
      icon: 'share',
      title: 'Post with context',
      text: 'Share the visual asset, caption, and unique link on WhatsApp or other supported social channels.',
    },
    {
      icon: 'wallet',
      title: 'Earn from valid actions',
      text: 'Valid clicks, sales, or approved campaign actions add to your wallet based on each campaign rule.',
    },
  ];

  readonly activeGuide = computed(() => (this.selectedGuide() === 'marketer' ? this.marketerGuide : this.promoterGuide));

  constructor(sanitizer: DomSanitizer) {
    super(sanitizer);
  }

  openRole(role: UserRole): void {
    this.selectedRole.set(role);
    this.activeSheet.set('role');
  }

  openStep(step: ProcessStep): void {
    this.selectedStep.set(step);
    this.activeSheet.set('step');
  }

  openFeature(feature: FeatureHighlight): void {
    this.selectedFeature.set(feature);
    this.activeSheet.set('feature');
  }

  openVideo(): void {
    this.activeSheet.set('video');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  selectGuide(guide: RoleGuide): void {
    this.selectedGuide.set(guide);
  }

  roleTone(index: number): string {
    return ['tone-marketer', 'tone-promoter'][index % 2];
  }

  featureTone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-purple', 'tone-orange'][index % 4];
  }
}
