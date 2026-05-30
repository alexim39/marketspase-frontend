import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
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

type PromotionFilter = 'all' | 'earning' | 'attention';
type OrderFilter = 'all' | 'ready' | 'waiting' | 'rejected';

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
  styleUrls: ['./mobile-promoted-products.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  promotionFilter = signal<PromotionFilter>('all');
  orderFilter = signal<OrderFilter>('all');
  releaseNotes = signal<Record<string, string>>({});

  currency = computed(() => this.user()?.wallets?.promoter?.currency || 'NGN');
  promotions = computed(() => this.dashboard()?.promotions || []);
  sales = computed(() => this.dashboard()?.sales || {});
  heroEarnings = computed(() => this.dashboard()?.totalEarnings || this.sales()?.totalCommission || 0);
  activePromotionCount = computed(() => this.dashboard()?.activePromotions || this.promotions().filter((promotion: any) => promotion?.affiliateUrl).length);
  releaseReadyCount = computed(() => this.affiliateOrders().filter((order) => this.canRequestRelease(order)).length);
  waitingReviewCount = computed(() => this.affiliateOrders().filter((order) => order?.releaseRequest?.status === 'requested').length);
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
    const filter = this.promotionFilter();

    let rows = this.promotions();

    if (filter === 'earning') {
      rows = rows.filter((promotion: any) => Number(promotion?.earnings || promotion?.conversions || 0) > 0);
    }

    if (filter === 'attention') {
      rows = rows.filter((promotion: any) => {
        const clicks = Number(promotion?.clicks || 0);
        const sales = Number(promotion?.conversions || 0);
        return !promotion?.affiliateUrl || this.performanceClass(promotion) === 'low' || (clicks >= 10 && sales === 0);
      });
    }

    if (!term) return rows;

    return rows.filter((promotion: any) => {
      return [
        promotion.productName,
        promotion.store?.name,
        promotion.uniqueCode,
        promotion.productCategory
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  });

  filteredAffiliateOrders = computed(() => {
    const filter = this.orderFilter();

    if (filter === 'ready') {
      return this.affiliateOrders().filter((order) => this.canRequestRelease(order));
    }

    if (filter === 'waiting') {
      return this.affiliateOrders().filter((order) => order?.releaseRequest?.status === 'requested');
    }

    if (filter === 'rejected') {
      return this.affiliateOrders().filter((order) => order?.releaseRequest?.status === 'rejected');
    }

    return this.affiliateOrders();
  });

  ngOnInit(): void {
    this.loadDashboard();
    this.loadAffiliateOrders();
  }

  refreshAll(): void {
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

    try {
      await navigator.clipboard.writeText(promotion.affiliateUrl);
      this.snackBar.open('Promotion link copied', 'Close', { duration: 2500 });
    } catch (error) {
      console.error('Failed to copy promotion link:', error);
      this.snackBar.open('Unable to copy link on this device', 'Close', { duration: 3000 });
    }
  }

  shareOnWhatsApp(promotion: any): void {
    if (!promotion?.affiliateUrl) {
      this.snackBar.open('Promotion link is not available yet', 'Close', { duration: 3000 });
      return;
    }

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

  promotionHealthLabel(promotion: any): string {
    if (!promotion?.affiliateUrl) return 'Missing link';

    const clicks = Number(promotion?.clicks || 0);
    const conversions = Number(promotion?.conversions || 0);

    if (clicks >= 10 && conversions === 0) return 'Needs conversion';
    if (this.performanceClass(promotion) === 'high') return 'High traction';
    if (this.performanceClass(promotion) === 'low') return 'Needs attention';
    return 'Stable';
  }

  promotionHealthClass(promotion: any): string {
    const label = this.promotionHealthLabel(promotion);

    if (label === 'High traction') return 'tone-good';
    if (label === 'Needs conversion' || label === 'Needs attention') return 'tone-warn';
    if (label === 'Missing link') return 'tone-bad';
    return 'tone-info';
  }

  orderStatusLabel(order: any): string {
    if (order?.releaseRequest?.status === 'requested') return 'Admin review';
    if (order?.releaseRequest?.status === 'rejected') return 'Rejected';
    if (order?.escrowStatus === 'released') return 'Released';
    if (this.canRequestRelease(order)) return 'Ready to request';
    if (order?.paymentStatus !== 'paid') return 'Awaiting payment';
    return String(order?.escrowStatus || order?.status || 'Processing').replace(/_/g, ' ');
  }

  orderStatusClass(order: any): string {
    if (order?.releaseRequest?.status === 'rejected') return 'tone-bad';
    if (order?.releaseRequest?.status === 'requested') return 'tone-warn';
    if (order?.escrowStatus === 'released') return 'tone-good';
    if (this.canRequestRelease(order)) return 'tone-info';
    return 'tone-muted';
  }

  percent(value: unknown): number {
    const parsed = Number(value || 0);
    return Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 0));
  }

  firstProductName(order: any): string {
    return order?.items?.[0]?.product?.name || 'Storefront order';
  }

  trackPromotion(index: number, promotion: any): string {
    return promotion?.trackingId || promotion?.uniqueCode || promotion?.productId || String(index);
  }

  trackOrder(index: number, order: any): string {
    return order?._id || order?.orderNumber || String(index);
  }
}
