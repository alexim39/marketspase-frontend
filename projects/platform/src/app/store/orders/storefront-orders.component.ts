import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CurrencyUtilsPipe } from '@shared/services';
import { UserService } from '../../common/services/user.service';
import { StorefrontOrderService } from '../services/storefront-order.service';

@Component({
  selector: 'app-storefront-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    CurrencyUtilsPipe
  ],
  templateUrl: './storefront-orders.component.html',
  styleUrls: ['./storefront-orders.component.scss']
})
export class StorefrontOrdersComponent implements OnInit {
  private userService = inject(UserService);
  private orderService = inject(StorefrontOrderService);
  private snackBar = inject(MatSnackBar);

  user = this.userService.user;
  loading = signal(true);
  orders = signal<any[]>([]);
  stats = signal<any>({});
  releaseNotes = signal<Record<string, string>>({});
  reviewNotes = signal<Record<string, string>>({});

  role = computed(() => this.user()?.role || '');
  currency = computed(() => {
    const user = this.user();
    return user?.wallets?.marketer?.currency || user?.wallets?.promoter?.currency || 'NGN';
  });
  pageTitle = computed(() => {
    if (this.role() === 'admin') return 'Delivery Release Reviews';
    if (this.role() === 'promoter') return 'Affiliate Sales';
    return 'Storefront Orders';
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    const user = this.user();
    if (!user?._id) {
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    const request = user.role === 'admin'
      ? this.orderService.getReleaseRequests(user._id)
      : user.role === 'promoter'
        ? this.orderService.getPromoterOrders(user._id)
        : this.orderService.getMarketerOrders(user._id);

    request.subscribe({
      next: (response) => {
        const data = response?.data || {};
        this.orders.set(data.orders || []);
        this.stats.set(data.stats || data.earnings || {});
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load storefront orders:', error);
        this.snackBar.open(error?.error?.message || 'Failed to load orders', 'Close', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  setReleaseNote(orderId: string, value: string): void {
    this.releaseNotes.update((notes) => ({ ...notes, [orderId]: value }));
  }

  setReviewNote(orderId: string, value: string): void {
    this.reviewNotes.update((notes) => ({ ...notes, [orderId]: value }));
  }

  requestRelease(order: any): void {
    const user = this.user();
    if (!user?._id || !order?._id || !['marketer', 'promoter'].includes(user.role || '')) return;

    this.orderService.requestRelease(order._id, {
      userId: user._id,
      role: user.role as 'marketer' | 'promoter',
      deliveryStatus: user.role === 'marketer' ? 'delivered' : 'received',
      buyerReceived: user.role === 'promoter',
      note: this.releaseNotes()[order._id] || `${user.role} requests admin review for delivery completion.`
    }).subscribe({
      next: () => {
        this.snackBar.open('Release request submitted for admin review', 'Close', { duration: 3000 });
        this.loadOrders();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message || 'Failed to request release', 'Close', { duration: 4000 });
      }
    });
  }

  review(order: any, decision: 'approved' | 'rejected'): void {
    const adminId = this.user()?._id;
    if (!adminId || !order?._id) return;

    this.orderService.reviewRelease(order._id, {
      adminId,
      decision,
      note: this.reviewNotes()[order._id] || ''
    }).subscribe({
      next: () => {
        this.snackBar.open(decision === 'approved' ? 'Funds released' : 'Request rejected', 'Close', { duration: 3000 });
        this.loadOrders();
      },
      error: (error) => {
        this.snackBar.open(error?.error?.message || 'Failed to review request', 'Close', { duration: 4000 });
      }
    });
  }

  canRequestRelease(order: any): boolean {
    return ['marketer', 'promoter'].includes(this.role())
      && order?.paymentStatus === 'paid'
      && order?.escrowStatus === 'held'
      && order?.releaseRequest?.status !== 'requested';
  }

  firstProductName(order: any): string {
    return order?.items?.[0]?.product?.name || 'Storefront order';
  }

  orderCommission(order: any): number {
    if (this.role() === 'promoter') {
      const userId = this.user()?._id;
      return (order?.items || [])
        .filter((item: any) => (item.promoterId?._id || item.promoterId)?.toString() === userId)
        .reduce((sum: number, item: any) => sum + Number(item.commissionEarned || 0), 0);
    }
    return Number(order?.totalPromoterCommission || 0);
  }
}
