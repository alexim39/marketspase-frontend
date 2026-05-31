import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PromotionInterface } from '@shared/services';
import { PromotionComponent } from '../promotion.component';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../components/loading-state/loading-state.component';
import { PromotionCardMobileComponent } from '../components/promotion-card/mobile/promotion-card-mobile.component';

@Component({
  selector: 'app-promotion-mobile',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
    LoadingStateComponent,
    PromotionCardMobileComponent,
  ],
  templateUrl: './promotion-mobile.component.html',
  styleUrls: ['./promotion-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromotionMobileComponent extends PromotionComponent {
  readonly mobileTabs = [
    { value: 'all', label: 'All', icon: 'apps' },
    { value: 'active', label: 'Active', icon: 'link' },
    { value: 'paid', label: 'Paid', icon: 'paid' },
    { value: 'rejected', label: 'Review', icon: 'warning' },
  ];

  getTabCount(tab: string): number {
    const stats = this.stats();
    if (tab === 'all') return stats.total;
    if (tab === 'active') return stats.active;
    if (tab === 'paid') return stats.paid;
    if (tab === 'rejected') return stats.rejected;
    return 0;
  }

  promotionTrack(index: number, promotion: PromotionInterface): string {
    return promotion._id || String(index);
  }
}
