import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { StoreService } from '../../../services/store.service';
import { StoreEmailSubscribersComponent } from '../store-subscribers.component';

type SubscriberStatus = 'all' | 'subscribed' | 'unsubscribed';

@Component({
  selector: 'app-store-email-subscribers-mobile',
  standalone: true,
  providers: [StoreService, ...provideNativeDateAdapter()],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './store-subscribers-mobile.component.html',
  styleUrls: ['./store-subscribers-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreEmailSubscribersMobileComponent extends StoreEmailSubscribersComponent {
  readonly statusOptions: Array<{ label: string; value: SubscriberStatus }> = [
    { label: 'All', value: 'all' },
    { label: 'Subscribed', value: 'subscribed' },
    { label: 'Unsubscribed', value: 'unsubscribed' },
  ];

  readonly sourceOptions = [
    { label: 'All sources', value: 'all' },
    { label: 'Storefront', value: 'storefront' },
    { label: 'Footer', value: 'storefront_footer' },
  ];

  readonly visibleStoreCount = computed(() => {
    const storeIds = new Set(this.subscribers().map((row) => row.store?._id || row.store?.storeLink).filter(Boolean));
    return storeIds.size;
  });

  readonly subscribedOnPage = computed(() =>
    this.subscribers().filter((row) => String(row.status || 'subscribed').toLowerCase() !== 'unsubscribed').length
  );

  readonly unsubscribedOnPage = computed(() =>
    this.subscribers().filter((row) => String(row.status || 'subscribed').toLowerCase() === 'unsubscribed').length
  );

  setStatusFilter(value: SubscriberStatus): void {
    this.statusFilter.set(value);
    this.loadSubscribers(true);
  }

  applySearch(value: string): void {
    this.search.set(value.trim());
    this.loadSubscribers(true);
  }

  setStartDate(value: string): void {
    this.startDate.set(value ? new Date(`${value}T00:00:00`) : null);
    this.loadSubscribers(true);
  }

  setEndDate(value: string): void {
    this.endDate.set(value ? new Date(`${value}T23:59:59`) : null);
    this.loadSubscribers(true);
  }

  dateInputValue(value: Date | null): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  sourceLabel(value?: string | null): string {
    const normalized = String(value || '').trim();
    if (!normalized) return 'Unknown source';
    return normalized
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  deviceIcon(value?: string | null): string {
    const normalized = String(value || '').toLowerCase();
    if (normalized.includes('mobile') || normalized.includes('phone')) return 'smartphone';
    if (normalized.includes('tablet')) return 'tablet_mac';
    return 'desktop_windows';
  }
}
