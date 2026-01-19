// components/store-promotions/store-promotions.component.ts
import { Component, input, output, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '../../models/store.model';
import { StoreService } from '../../services/store.service';
import { MatBadgeModule } from '@angular/material/badge';
import { Product, StorePromotion } from '../../models';

interface PromotionStats {
  total: number;
  active: number;
  draft: number;
  completed: number;
  totalBudget: number;
  totalSpent: number;
}

// interface Promotion {
//   status: 'active' | 'draft' | 'completed' | 'paused' | 'cancelled';
//   budget: number;
//   analytics: { totalSpent: number };
//   // Other props...
// }

@Component({
  selector: 'app-store-promotions',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatBadgeModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  templateUrl: './store-promotions.component.html',
  styleUrls: ['./store-promotions.component.scss']
})
export class StorePromotionsComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private storeService = inject(StoreService);

  // Inputs
  store = input.required<Store>();
  products = input.required<Product[]>();

  // Outputs
  promotionUpdated = output<void>();

  // Signals
  promotions = this.storeService.promotionsState;
  loading = signal<boolean>(false);
  filterStatus = signal<'all' | 'active' | 'draft' | 'completed'>('all');

  // Computed properties
  promotionStats = computed((): PromotionStats => {
    const promotions = this.promotions();

    return {
      total: promotions.length,
      active: promotions.filter((p: StorePromotion) => p.status === 'active').length,
      draft: promotions.filter((p: StorePromotion) => p.status === 'draft').length,
      completed: promotions.filter((p: StorePromotion) => p.status === 'completed').length,
      totalBudget: promotions.reduce((sum: number, p: StorePromotion) => sum + p.budget, 0),
      totalSpent: promotions.reduce((sum: number, p: StorePromotion) => sum + p.analytics.totalSpent, 0)
    };
  });

  filteredPromotions = computed(() => {
    const promotions = this.promotions();
    const filter = this.filterStatus();

    if (filter === 'all') return promotions;
    return promotions.filter((p: StorePromotion) => p.status === filter);
  });

  availableProducts = computed(() => {
    return this.products().filter(p => p.isActive && p.quantity > 0);
  });

  canCreatePromotion = computed(() => {
    return this.store().isVerified && this.availableProducts().length > 0;
  });

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    // const store = this.store();
    // if (store) {
    //   this.storeService.getStorePromotions(store._id!).subscribe();
    // }
  }

  createPromotion(): void {
    if (!this.canCreatePromotion()) {
      if (!this.store().isVerified) {
        this.snackBar.open('Store verification required to create promotions', 'OK', { duration: 3000 });
        return;
      }
      if (this.availableProducts().length === 0) {
        this.snackBar.open('No active products available for promotion', 'OK', { duration: 3000 });
        return;
      }
    }

    this.router.navigate(['/dashboard/stores', this.store()._id, 'promotions', 'create']);
  }

  viewPromotion(promotion: StorePromotion): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'promotions', promotion._id]);
  }

  editPromotion(promotion: StorePromotion): void {
    this.router.navigate(['/dashboard/stores', this.store()._id, 'promotions', promotion._id, 'edit']);
  }

  duplicatePromotion(promotion: StorePromotion): void {
    // Implement duplicate logic
    this.snackBar.open('Duplication feature coming soon', 'OK', { duration: 3000 });
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      active: 'primary',
      draft: 'accent',
      completed: 'basic',
      paused: 'warn',
      cancelled: 'warn'
    };
    return colors[status] || 'basic';
  }

  getProgress(promotion: StorePromotion): number {
    if (promotion.budget === 0) return 0;
    return (promotion.analytics.totalSpent / promotion.budget) * 100;
  }

  getROI(promotion: StorePromotion): number {
    if (promotion.analytics.totalSpent === 0) return 0;
    return ((promotion.analytics.totalRevenue - promotion.analytics.totalSpent) / promotion.analytics.totalSpent) * 100;
  }

  formatCurrency(amount: number): string {
    return `₦${amount.toLocaleString()}`;
  }

  trackByPromotionId(index: number, promotion: StorePromotion): string {
    return promotion._id!;
  }
}