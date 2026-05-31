import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../core/header/header.component';
import { FooterComponent } from '../../core/footer/footer.component';
import { Feature, FeaturesComponent } from '../features.component';

type FeatureCategoryId = 'marketer' | 'promoter' | 'platform';
type FeatureSheet = 'feature' | 'category' | null;
type WorkflowType = 'marketer' | 'promoter';

@Component({
  selector: 'app-features-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, HeaderComponent, FooterComponent],
  templateUrl: './features-mobile.component.html',
  styleUrls: ['./features-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesMobileComponent extends FeaturesComponent {
  readonly activeSheet = signal<FeatureSheet>(null);
  readonly selectedFeature = signal<Feature | null>(null);
  readonly workflowType = signal<WorkflowType>('marketer');

  readonly mobileStats = [
    { value: '10K+', label: 'Social promoters' },
    { value: 'NGN Millions', label: 'Potential sales' },
    { value: '5 mins', label: 'To start' },
  ];

  readonly workflowSteps = {
    marketer: [
      {
        number: '01',
        icon: 'storefront',
        title: 'Create your store',
        text: 'Upload products, set prices, and make your storefront available to promoters.',
      },
      {
        number: '02',
        icon: 'share',
        title: 'Promoters share',
        text: 'Promoters select products, share unique links, and bring buyers from WhatsApp and social channels.',
      },
      {
        number: '03',
        icon: 'payments',
        title: 'Track sales',
        text: 'Orders, referral links, commissions, and marketer revenue remain connected in the dashboard.',
      },
    ],
    promoter: [
      {
        number: '01',
        icon: 'inventory_2',
        title: 'Browse products',
        text: 'Find products that match your audience and have clear commission rules.',
      },
      {
        number: '02',
        icon: 'link',
        title: 'Share your link',
        text: 'Use your unique referral link and social-ready content to promote the product.',
      },
      {
        number: '03',
        icon: 'wallet',
        title: 'Earn commission',
        text: 'When buyers order through your link, valid commission is tracked for your wallet.',
      },
    ],
  };

  readonly activeWorkflow = computed(() => this.workflowSteps[this.workflowType()]);
  readonly activeCategoryMeta = computed(() => {
    const category = this.activeCategory();
    return this.featureCategories().find((item) => item.id === category) || this.featureCategories()[0];
  });

  selectCategory(category: string): void {
    if (!this.isFeatureCategoryId(category)) return;
    this.setActiveCategory(category);
  }

  selectWorkflow(type: WorkflowType): void {
    this.workflowType.set(type);
  }

  openFeature(feature: Feature): void {
    this.selectedFeature.set(feature);
    this.activeSheet.set('feature');
  }

  openCategorySheet(): void {
    this.activeSheet.set('category');
  }

  closeSheet(): void {
    this.activeSheet.set(null);
  }

  tone(index: number): string {
    return ['tone-blue', 'tone-green', 'tone-purple', 'tone-orange'][index % 4];
  }

  private isFeatureCategoryId(category: string): category is FeatureCategoryId {
    return category === 'marketer' || category === 'promoter' || category === 'platform';
  }
}
