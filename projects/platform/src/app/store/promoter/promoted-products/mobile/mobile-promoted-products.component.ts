import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyUtilsPipe } from '@shared/services';
import { UserService } from '../../../../common/services/user.service';
import { StorefrontOrderService } from '../../../services/storefront-order.service';
import { PromotionService } from '../../services/promotion.service';

@Component({
  selector: 'app-mobile-promoted-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    CurrencyUtilsPipe
  ],
  providers: [PromotionService],
  templateUrl: './mobile-promoted-products.component.html',
  styleUrls: ['./mobile-promoted-products.component.scss']
})
export class MobilePromotedProductsComponent implements OnInit {
  private promotionService = inject(PromotionService);
  private orderService = inject(StorefrontOrderService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  user = this.userService.user;
  loading = signal(true);
  ordersLoading = signal(false);
  error = signal<string | null>(null);
  dashboard = signal<any | null>(null);
  affiliateOrders = signal<any[]>([]);
  search = signal('');
  releaseNotes = signal<Record<string, string>>({});

  currency = computed(() => this.user()?.wallets?.promoter?.currency || 'NGN');
  promotions = computed(() => this.dashboard()?.promotions || []);
  sales = computed(() => this.dashboard()?.sales || {});
  summaryCards = computed(() => {
    const data = this.dashboard() || {};
    const sales = this.sales();

    return [
      { label: 'Total Earnings', value: data.totalEarnings || sales.totalCommission || 0, icon: 'payments', money: true },
      { label: 'Reserved', value: sales.reservedCommission || 0, icon: 'lock_clock', money: true },
      { label: 'Released', value: sales.releasedCommission || 0, icon: 'verified', money: true },
      { label: 'Clicks', value: data.totalClicks || 0, icon: 'ads_click' },
      { label: 'Sales', value: sales.totalSales || data.totalConversions || 0, icon: 'shopping_bag' },
      { label: 'Active Links', value: data.activePromotions || 0, icon: 'link' }
    ];
  });

  filteredPromotions = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.promotions();

    return this.promotions().filter((promotion: any) => {
      return [
        promotion.productName,
        promotion.store?.name,
        promotion.uniqueCode,
        promotion.productCategory
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  });

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAffiliateOrders();
  }

  loadDashboard(): void {
    const promoterId = this.user()?._id;
    if (!promoterId) {
      this.loading.set(false);
      this.error.set('Your promoter profile is still loading. Please refresh if this continues.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.promotionService.getPromotionDashboard(promoterId).subscribe({
      next: (response) => {
        this.dashboard.set(response?.data || null);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load promoted products dashboard:', error);
        this.error.set('Failed to load promoted product analytics.');
        this.loading.set(false);
      }
    });
  }

  loadAffiliateOrders(): void {
    const promoterId = this.user()?._id;
    if (!promoterId) return;

    this.ordersLoading.set(true);
    this.orderService.getPromoterOrders(promoterId, { limit: 10 }).subscribe({
      next: (response) => {
        this.affiliateOrders.set(response?.data?.orders || []);
        this.ordersLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load affiliate orders:', error);
        this.ordersLoading.set(false);
      }
    });
  }

  async copyLink(promotion: any): Promise<void> {
    if (!promotion?.affiliateUrl) return;
    await navigator.clipboard.writeText(promotion.affiliateUrl);
    this.snackBar.open('Promotion link copied', 'Close', { duration: 2500 });
  }

  shareOnWhatsApp(promotion: any): void {
    const message = encodeURIComponent(`${promotion.productName}\n\nOrder securely on MarketSpase:\n${promotion.affiliateUrl}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }

  setReleaseNote(orderId: string, value: string): void {
    this.releaseNotes.update((notes) => ({ ...notes, [orderId]: value }));
  }

  requestRelease(order: any): void {
    const promoterId = this.user()?._id;
    if (!promoterId || !order?._id) return;

    this.orderService.requestRelease(order._id, {
      userId: promoterId,
      role: 'promoter',
      deliveryStatus: 'received',
      buyerReceived: true,
      note: this.releaseNotes()[order._id] || 'Promoter requests admin review for delivery completion and commission release.'
    }).subscribe({
      next: () => {
        this.snackBar.open('Release request submitted for admin review', 'Close', { duration: 3000 });
        this.loadAffiliateOrders();
      },
      error: (error) => {
        console.error('Failed to request release:', error);
        this.snackBar.open(error?.error?.message || 'Failed to submit release request', 'Close', { duration: 4000 });
      }
    });
  }

  canRequestRelease(order: any): boolean {
    return order?.paymentStatus === 'paid'
      && order?.escrowStatus === 'held'
      && order?.releaseRequest?.status !== 'requested';
  }

  conversionRate(promotion: any): number {
    return Number(promotion?.conversionRate || 0);
  }

  performanceClass(promotion: any): string {
    return promotion?.performance || 'medium';
  }

  firstProductName(order: any): string {
    return order?.items?.[0]?.product?.name || 'Storefront order';
  }
}
