import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../core/header/header.component';
import { FooterComponent } from '../../core/footer/footer.component';
import { Benefit, BenefitsComponent } from '../benefits.component';

type BenefitAudience = 'business' | 'promoter' | 'platform';
type BenefitSheet = 'benefit' | 'audience' | null;

@Component({
  selector: 'app-benefits-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './benefits-mobile.component.html',
  styleUrls: ['./benefits-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BenefitsMobileComponent extends BenefitsComponent {
  readonly selectedAudience = signal<BenefitAudience>('business');
  readonly activeSheet = signal<BenefitSheet>(null);
  readonly selectedBenefit = signal<Benefit | null>(null);

  readonly mobileStats = [
    { value: '10K+', label: 'Promoters' },
    { value: 'NGN Millions', label: 'Potential sales' },
    { value: '5 mins', label: 'Setup time' },
    { value: '500+', label: 'Businesses' },
  ];

  readonly audienceCards = [
    {
      id: 'business' as const,
      icon: 'storefront',
      title: 'For businesses',
      summary: 'Grow sales through promoters, tracked links, and performance-based spending.',
      action: 'See business benefits',
    },
    {
      id: 'promoter' as const,
      icon: 'workspace_premium',
      title: 'For promoters',
      summary: 'Earn from valid tracked clicks, product activity, and real social audience engagement.',
      action: 'See earning benefits',
    },
    {
      id: 'platform' as const,
      icon: 'verified_user',
      title: 'Platform trust',
      summary: 'Secure transactions, fraud controls, analytics, and support for both sides.',
      action: 'See platform benefits',
    },
  ];

  readonly activeAudienceCard = computed(() => {
    const selected = this.selectedAudience();
    return this.audienceCards.find((card) => card.id === selected) || this.audienceCards[0];
  });

  readonly activeBenefits = computed(() => {
    switch (this.selectedAudience()) {
      case 'promoter':
        return this.promoterBenefits();
      case 'platform':
        return this.platformBenefits();
      case 'business':
      default:
        return this.businessBenefits();
    }
  });

  readonly highlightedBenefits = computed(() => this.activeBenefits().slice(0, 3));

  selectAudience(audience: BenefitAudience): void {
    this.selectedAudience.set(audience);
  }

  openBenefit(benefit: Benefit): void {
    this.selectedBenefit.set(benefit);
    this.activeSheet.set('benefit');
  }

  openAudienceSheet(): void {
    this.activeSheet.set('audience');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  benefitTone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-purple', 'tone-orange'][index % 4];
  }
}
