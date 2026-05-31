import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrencyUtilsPipe } from '@shared/services';
import { StorefrontOrdersComponent } from '../storefront-orders.component';

type OrderFilter = 'all' | 'needs_action' | 'review' | 'held' | 'released';

@Component({
  selector: 'app-mobile-storefront-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileStorefrontOrdersComponent extends StorefrontOrdersComponent {
  readonly activeFilter = signal<OrderFilter>('all');
  readonly searchQuery = signal('');
  readonly selectedReleaseOrder = signal<any | null>(null);
  readonly selectedReviewOrder = signal<any | null>(null);

  readonly filterOptions = computed(() => [
    { id: 'all' as const, label: 'All', icon: 'receipt_long', count: this.orders().length },
    { id: 'needs_action' as const, label: 'Action', icon: 'task_alt', count: this.orders().filter(order => this.canRequestRelease(order)).length },
    { id: 'review' as const, label: 'Review', icon: 'hourglass_top', count: this.orders().filter(order => order?.releaseRequest?.status === 'requested').length },
    { id: 'held' as const, label: 'Held', icon: 'lock', count: this.orders().filter(order => order?.escrowStatus === 'held').length },
    { id: 'released' as const, label: 'Released', icon: 'verified', count: this.orders().filter(order => order?.escrowStatus === 'released').length },
  ]);

  readonly filteredOrders = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.activeFilter();

    return this.orders().filter(order => {
      const searchable = [
        order?.orderNumber,
        this.firstProductName(order),
        order?.shippingAddress?.fullName,
        order?.shippingAddress?.phone,
        order?.shippingAddress?.city,
        order?.shippingAddress?.state,
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesFilter = this.matchesFilter(order, filter);
      return matchesSearch && matchesFilter;
    });
  });

  readonly groupedOrders = computed(() => {
    const groups = new Map<string, any[]>();
    this.filteredOrders().forEach(order => {
      const key = this.groupLabel(order);
      groups.set(key, [...(groups.get(key) || []), order]);
    });
    return Array.from(groups, ([label, rows]) => ({ label, rows }));
  });

  setFilter(filter: OrderFilter): void {
    this.activeFilter.set(filter);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  openReleaseSheet(order: any): void {
    this.selectedReleaseOrder.set(order);
  }

  closeReleaseSheet(): void {
    this.selectedReleaseOrder.set(null);
  }

  submitRelease(order: any): void {
    this.requestRelease(order);
    this.closeReleaseSheet();
  }

  openReviewSheet(order: any): void {
    this.selectedReviewOrder.set(order);
  }

  closeReviewSheet(): void {
    this.selectedReviewOrder.set(null);
  }

  submitReview(order: any, decision: 'approved' | 'rejected'): void {
    this.review(order, decision);
    this.closeReviewSheet();
  }

  paymentTone(order: any): 'good' | 'warn' | 'bad' {
    const status = String(order?.paymentStatus || '').toLowerCase();
    if (status === 'paid' || status === 'completed') return 'good';
    if (status === 'pending') return 'warn';
    return 'bad';
  }

  escrowTone(order: any): 'good' | 'warn' | 'bad' {
    const status = String(order?.escrowStatus || '').toLowerCase();
    if (status === 'released') return 'good';
    if (status === 'held') return 'warn';
    return 'bad';
  }

  deliveryLabel(order: any): string {
    return order?.deliveryStatus || order?.fulfillmentStatus || order?.status || 'processing';
  }

  buyerLine(order: any): string {
    const address = order?.shippingAddress;
    if (!address) return 'No delivery address attached';
    return [address.phone, address.city, address.state].filter(Boolean).join(' • ');
  }

  orderDate(order: any): Date | null {
    const value = order?.createdAt || order?.updatedAt || order?.paidAt;
    return value ? new Date(value) : null;
  }

  private matchesFilter(order: any, filter: OrderFilter): boolean {
    if (filter === 'all') return true;
    if (filter === 'needs_action') return this.canRequestRelease(order);
    if (filter === 'review') return order?.releaseRequest?.status === 'requested';
    if (filter === 'held') return order?.escrowStatus === 'held';
    if (filter === 'released') return order?.escrowStatus === 'released';
    return true;
  }

  private groupLabel(order: any): string {
    if (this.canRequestRelease(order)) return 'Needs your action';
    if (order?.releaseRequest?.status === 'requested') return this.role() === 'admin' ? 'Pending admin review' : 'Waiting for review';
    if (order?.escrowStatus === 'released') return 'Released orders';
    return 'Recent orders';
  }
}
