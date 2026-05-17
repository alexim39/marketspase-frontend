import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  AdminBuyerDetail,
  AdminBuyerRecord,
  StoreService,
} from '../store.service';

type LifecycleStage = 'new' | 'active' | 'repeat' | 'vip' | 'at_risk' | 'suppressed';

@Component({
  selector: 'admin-store-buyers',
  standalone: true,
  providers: [StoreService],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './store-buyers.component.html',
  styleUrls: ['./store-buyers.component.scss'],
})
export class StoreBuyersComponent {
  private readonly storeService = inject(StoreService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly saving = signal(false);

  readonly buyers = signal<AdminBuyerRecord[]>([]);
  readonly summary = signal({
    totalCustomers: 0,
    optedInCustomers: 0,
    repeatCustomers: 0,
    vipCustomers: 0,
    suppressedCustomers: 0,
    totalRevenue: 0,
    totalOrders: 0,
    linkedStores: 0,
    averageOrderValue: 0,
  });
  readonly pagination = signal({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  readonly storeOptions = signal<Array<{ _id: string; name: string; storeLink?: string; logo?: string }>>([]);
  readonly marketerOptions = signal<Array<{ _id: string; displayName?: string; username?: string; email?: string }>>([]);

  readonly search = signal('');
  readonly storeFilter = signal('all');
  readonly marketerFilter = signal('all');
  readonly lifecycleFilter = signal('all');
  readonly segmentFilter = signal('all');
  readonly customerTypeFilter = signal('all');
  readonly marketingFilter = signal('all');

  readonly activeBuyerKey = signal<string | null>(null);
  readonly activeDetail = signal<AdminBuyerDetail | null>(null);

  readonly detailLifecycle = signal<LifecycleStage>('new');
  readonly detailNotes = signal('');
  readonly detailMarketingOptIn = signal(true);
  readonly detailPreferredChannels = signal<Array<'email' | 'sms'>>([]);
  readonly detailLastCampaignName = signal('');

  constructor() {
    this.loadBuyers(true);
  }

  loadBuyers(resetPage = false): void {
    if (resetPage) {
      this.pagination.update((current) => ({ ...current, page: 1 }));
    }

    this.loading.set(true);

    this.storeService.getAdminBuyers({
      page: this.pagination().page,
      limit: this.pagination().limit,
      search: this.search().trim(),
      storeId: this.storeFilter() !== 'all' ? this.storeFilter() : undefined,
      marketerId: this.marketerFilter() !== 'all' ? this.marketerFilter() : undefined,
      lifecycleStage: this.lifecycleFilter(),
      marketingOptIn: this.marketingFilter(),
      customerType: this.customerTypeFilter(),
      segment: this.segmentFilter(),
      sortBy: 'lastOrderAt',
      sortOrder: 'desc',
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response.data;
          this.buyers.set(data.buyers || []);
          this.summary.set(data.summary || this.summary());
          this.pagination.set(data.pagination || this.pagination());
          this.storeOptions.set(data.filters?.stores || []);
          this.marketerOptions.set(data.filters?.marketers || []);

          if (!this.activeBuyerKey() && data.buyers?.length) {
            this.selectBuyer(data.buyers[0].buyerKey);
          } else if (this.activeBuyerKey() && !data.buyers.some((buyer) => buyer.buyerKey === this.activeBuyerKey())) {
            this.activeBuyerKey.set(null);
            this.activeDetail.set(null);
          }

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load admin buyers:', error);
          this.loading.set(false);
          this.snackBar.open(error?.error?.message || 'Failed to load buyers.', 'Close', { duration: 4000 });
        },
      });
  }

  refresh(): void {
    this.loadBuyers(false);
    if (this.activeBuyerKey()) {
      this.loadBuyerDetail(this.activeBuyerKey() as string, false);
    }
  }

  previousPage(): void {
    if (this.pagination().page <= 1 || this.loading()) {
      return;
    }

    this.pagination.update((current) => ({ ...current, page: current.page - 1 }));
    this.loadBuyers(false);
  }

  nextPage(): void {
    if (this.pagination().page >= this.pagination().totalPages || this.loading()) {
      return;
    }

    this.pagination.update((current) => ({ ...current, page: current.page + 1 }));
    this.loadBuyers(false);
  }

  selectBuyer(buyerKey: string): void {
    this.activeBuyerKey.set(buyerKey);
    this.loadBuyerDetail(buyerKey, true);
  }

  loadBuyerDetail(email: string, setLoading = true): void {
    if (!email) {
      return;
    }

    if (setLoading) {
      this.detailLoading.set(true);
    }

    this.storeService.getAdminBuyerDetail(email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.activeDetail.set(response.data);
          this.setDetailDrafts(response.data);
          this.detailLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load buyer detail:', error);
          this.detailLoading.set(false);
          this.snackBar.open(error?.error?.message || 'Failed to load buyer detail.', 'Close', { duration: 4000 });
        },
      });
  }

  saveBuyer(): void {
    const detail = this.activeDetail();
    if (!detail?.buyer?.email) {
      return;
    }

    this.saving.set(true);
    this.storeService.updateAdminBuyerMeta({
      email: detail.buyer.email,
      lifecycleStage: this.detailLifecycle(),
      notes: this.detailNotes(),
      marketingOptIn: this.detailMarketingOptIn(),
      preferredChannels: this.detailPreferredChannels(),
      lastCampaignName: this.detailLastCampaignName(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Buyer record updated.', 'Close', { duration: 2800 });
          this.saving.set(false);
          this.loadBuyers(false);
          this.loadBuyerDetail(detail.buyer.email, false);
        },
        error: (error) => {
          console.error('Failed to save buyer record:', error);
          this.saving.set(false);
          this.snackBar.open(error?.error?.message || 'Unable to save buyer record.', 'Close', { duration: 3600 });
        },
      });
  }

  exportVisibleBuyers(): void {
    const rows = [
      ['Name', 'Email', 'Phone', 'Opted In', 'Lifecycle Stage', 'Segment', 'Orders', 'Total Spent', 'Linked Stores', 'Linked Marketers', 'Last Order'],
      ...this.buyers().map((buyer) => ([
        buyer.fullName || '',
        buyer.email || '',
        buyer.phone || '',
        buyer.marketingOptIn ? 'Yes' : 'No',
        buyer.lifecycleStage || '',
        buyer.behaviorSegment || '',
        String(buyer.orderCount || 0),
        String(buyer.totalSpent || 0),
        buyer.linkedStores.map((store) => store.name).join(' | '),
        buyer.linkedMarketers.map((marketer) => marketer.displayName || marketer.username || marketer.email || '').join(' | '),
        buyer.lastOrderAt || '',
      ])),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `store-buyers-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  openBuyerEmail(email?: string | null): void {
    if (!email) {
      this.snackBar.open('No email address is available for this buyer.', 'Close', { duration: 3200 });
      return;
    }

    window.location.href = `mailto:${encodeURIComponent(email)}`;
  }

  openBuyerSms(phone?: string | null): void {
    if (!phone) {
      this.snackBar.open('No phone number is available for this buyer.', 'Close', { duration: 3200 });
      return;
    }

    window.location.href = `sms:${phone}`;
  }

  async copyBuyerContact(buyer: Pick<AdminBuyerRecord, 'fullName' | 'email' | 'phone'>): Promise<void> {
    const contact = [buyer.fullName, buyer.email, buyer.phone].filter(Boolean).join(' | ');
    await this.copyText(contact, 'Buyer contact copied.');
  }

  async copyVisibleEmails(): Promise<void> {
    const emails = [...new Set(this.buyers().map((buyer) => buyer.email).filter(Boolean))];
    if (!emails.length) {
      this.snackBar.open('There are no buyer emails to copy.', 'Close', { duration: 3200 });
      return;
    }

    await this.copyText(emails.join(', '), 'Buyer email list copied.');
  }

  buyerTitle(buyer: AdminBuyerRecord): string {
    return buyer.fullName || buyer.email || 'Buyer';
  }

  lifecycleStageLabel(value?: string | null): string {
    return this.humanizeStage(value || 'new');
  }

  behaviorSegmentLabel(value?: string | null): string {
    return this.humanizeStage(value || 'new');
  }

  behaviorSegmentClass(value?: string | null): string {
    return this.normalizeStageValue(value, 'new');
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || 'MS';
  }

  setPreferredChannel(channel: 'email' | 'sms', checked: boolean): void {
    const current = new Set(this.detailPreferredChannels());
    if (checked) {
      current.add(channel);
    } else {
      current.delete(channel);
    }

    this.detailPreferredChannels.set([...current]);
  }

  summaryCards(): Array<{ label: string; value: string; icon: string; tone: string }> {
    return [
      { label: 'Buyers', value: `${this.summary().totalCustomers || 0}`, icon: 'groups', tone: 'primary' },
      { label: 'Opted In', value: `${this.summary().optedInCustomers || 0}`, icon: 'mark_email_read', tone: 'success' },
      { label: 'VIP', value: `${this.summary().vipCustomers || 0}`, icon: 'workspace_premium', tone: 'warning' },
      { label: 'Revenue', value: `${this.summary().totalRevenue || 0}`, icon: 'payments', tone: 'accent' },
    ];
  }

  storePreview(buyer: AdminBuyerRecord): string {
    if (!buyer.linkedStores?.length) {
      return 'No linked stores';
    }

    const visible = buyer.linkedStores.slice(0, 2).map((store) => store.name);
    return buyer.linkedStores.length > 2
      ? `${visible.join(', ')} +${buyer.linkedStores.length - 2}`
      : visible.join(', ');
  }

  marketerPreview(buyer: AdminBuyerRecord): string {
    if (!buyer.linkedMarketers?.length) {
      return 'No linked marketers';
    }

    const visible = buyer.linkedMarketers
      .slice(0, 2)
      .map((marketer) => marketer.displayName || marketer.username || marketer.email || 'Marketer');

    return buyer.linkedMarketers.length > 2
      ? `${visible.join(', ')} +${buyer.linkedMarketers.length - 2}`
      : visible.join(', ');
  }

  lastKnownLocation(detail: AdminBuyerDetail | null): string {
    const location = detail?.buyer?.lastKnownLocation;
    if (!location) {
      return 'No recent delivery location';
    }

    return [location.city, location.state, location.country].filter(Boolean).join(', ') || 'No recent delivery location';
  }

  private setDetailDrafts(detail: AdminBuyerDetail): void {
    this.detailLifecycle.set(detail.buyer.lifecycleStage || 'new');
    this.detailNotes.set(detail.buyer.notes || '');
    this.detailMarketingOptIn.set(detail.buyer.marketingOptIn !== false);
    this.detailPreferredChannels.set(detail.buyer.preferredChannels || []);
    this.detailLastCampaignName.set(detail.buyer.lastCampaignName || '');
  }

  private normalizeStageValue(value: string | null | undefined, fallback: string): string {
    const normalized = String(value || fallback).trim().toLowerCase();
    return normalized || fallback;
  }

  private humanizeStage(value: string): string {
    return this.normalizeStageValue(value, 'new')
      .split('_')
      .join(' ');
  }

  private async copyText(text: string, successMessage: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.snackBar.open(successMessage, 'Close', { duration: 2400 });
    } catch (error) {
      console.error('Clipboard write failed:', error);
      this.snackBar.open('Copy failed on this device.', 'Close', { duration: 3200 });
    }
  }
}
