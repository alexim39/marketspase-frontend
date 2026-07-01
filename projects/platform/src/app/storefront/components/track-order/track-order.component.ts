import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, FormsModule],
  template: `
    <div class="track-page">
      <div class="track-card">
        @if (loading()) {
          <div class="state"><mat-spinner diameter="36"/><p>Loading order...</p></div>
        } @else if (error()) {
          <div class="state"><mat-icon>error_outline</mat-icon><h2>{{ error() }}</h2></div>
        } @else if (order()) {
          <div class="order-header">
            <mat-icon>{{ icon() }}</mat-icon>
            <h1>{{ title() }}</h1>
            <p>{{ description() }}</p>
          </div>

          <div class="order-details">
            <div><strong>Order</strong><span>{{ order()?.orderNumber }}</span></div>
            <div><strong>Status</strong><span class="badge">{{ order()?.orderStatus }}</span></div>
            <div><strong>Date</strong><span>{{ order()?.createdAt | date:'mediumDate' }}</span></div>
          </div>

          @if (canConfirm()) {
            <button mat-flat-button color="primary" class="confirm-btn" (click)="confirmDelivery()" [disabled]="confirming()">
              <mat-icon>{{ confirming() ? 'hourglass_empty' : 'check_circle' }}</mat-icon>
              {{ confirming() ? 'Confirming...' : 'I Received My Order' }}
            </button>
          } @else if (order()?.orderStatus === 'delivered') {
            <div class="done-badge"><mat-icon>done_all</mat-icon><span>Delivery confirmed</span></div>
          }

          <a mat-button routerLink="/store/{{ order()?.store?.storeLink || '' }}">
            <mat-icon>store</mat-icon> Back to Store
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .track-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--background-color); padding: 1.5rem; }
    .track-card { max-width: 420px; width: 100%; background: var(--surface-color); border-radius: 16px; border: 1px solid var(--border-color); padding: 2rem; text-align: center; }
    .state { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 2rem 0; color: var(--text-secondary); }
    .order-header { mat-icon { font-size: 3rem; width: 3rem; height: 3rem; color: var(--primary-color); } h1 { margin: 0.5rem 0 0.25rem; font-size: 1.2rem; } p { color: var(--text-secondary); font-size: 0.88rem; } }
    .order-details { text-align: left; margin: 1.25rem 0; display: flex; flex-direction: column; gap: 0.5rem;
      div { display: flex; justify-content: space-between; font-size: 0.88rem; strong { color: var(--text-secondary); } span { color: var(--text-primary); font-weight: 500; } }
      .badge { padding: 0.15rem 0.5rem; background: rgba(var(--primary-rgb), 0.08); border-radius: 999px; font-size: 0.75rem; color: var(--primary-color); }
    }
    .confirm-btn { width: 100%; height: 46px; font-weight: 600; font-size: 0.9rem; border-radius: 12px; margin-bottom: 0.75rem; }
    .done-badge { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: rgba(var(--success-rgb), 0.08); border-radius: 12px; color: var(--success-color); font-weight: 600; margin-bottom: 0.75rem; }
    a { color: var(--primary-color); text-decoration: none; font-weight: 500; }
  `]
})
export class TrackOrderComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  orderId = signal('');
  order = signal<any>(null);
  loading = signal(true);
  error = signal('');
  confirming = signal(false);

  ngOnInit(): void {
    this.orderId.set(this.route.snapshot.queryParamMap.get('order') || '');
    if (!this.orderId()) { this.error.set('Order not found.'); this.loading.set(false); return; }
    this.loadOrder();
  }

  loadOrder(): void {
    this.api.get<any>(`api/v1/stores/storefront/orders/${this.orderId()}`, undefined, undefined, true)
      .subscribe({
        next: (r) => { this.order.set(r?.data); this.loading.set(false); },
        error: () => { this.error.set('Failed to load order.'); this.loading.set(false); },
      });
  }

  canConfirm(): boolean {
    const o = this.order();
    return o?.orderStatus === 'processing' && o?.paymentStatus === 'paid' && o?.escrowStatus === 'held';
  }

  icon(): string {
    const o = this.order();
    return o?.orderStatus === 'delivered' ? 'check_circle' : o?.orderStatus === 'processing' ? 'inventory_2' : 'schedule';
  }

  title(): string {
    const o = this.order();
    return o?.orderStatus === 'delivered' ? 'Order Delivered!' : o?.orderStatus === 'processing' ? 'Order Processing' : 'Order Status';
  }

  description(): string {
    const o = this.order();
    return o?.orderStatus === 'delivered' ? 'Funds released to seller.' : o?.orderStatus === 'processing' ? 'Payment confirmed. Awaiting delivery.' : '';
  }

  confirmDelivery(): void {
    this.confirming.set(true);
    this.api.post(`api/v1/stores/storefront/orders/${this.orderId()}/confirm-delivery`, { buyerReceived: true }, undefined, true)
      .subscribe({
        next: () => { this.confirming.set(false); this.loadOrder(); },
        error: (e) => { this.confirming.set(false); this.snack.open(e?.error?.message || 'Failed', 'OK', { duration: 4000 }); },
      });
  }
}
