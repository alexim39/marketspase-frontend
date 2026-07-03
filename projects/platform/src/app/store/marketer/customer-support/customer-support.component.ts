import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyUtilsPipe } from '@shared/services';
import { UserService } from '../../../common/services/user.service';
import {
  MarketerCustomerDetail,
  MarketerCustomerRecord,
  StoreCustomerService,
} from '../../services/store-customer.service';
import { SupportSmsDialogComponent, SmsDialogData } from './support-sms-dialog.component';
import { SupportBulkSmsDialogComponent, BulkSmsDialogData } from './support-bulk-sms-dialog.component';

type ComposeChannel = 'email' | 'sms';
type LifecycleStage = 'new' | 'active' | 'repeat' | 'vip' | 'at_risk' | 'suppressed';

interface ComposeTemplate {
  id: string;
  label: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-customer-support',
  standalone: true,
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
    MatTooltipModule,
    CurrencyUtilsPipe,
  ],
  templateUrl: './customer-support.component.html',
  styleUrls: ['./customer-support.component.scss'],
})
export class CustomerSupportComponent {
  private readonly userService = inject(UserService);
  private readonly customerService = inject(StoreCustomerService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.userService.user;

  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly savingDetail = signal(false);

  readonly customers = signal<MarketerCustomerRecord[]>([]);
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
    limit: 18,
    total: 0,
    totalPages: 1,
  });
  readonly storeOptions = signal<Array<{ _id: string; name: string; storeLink?: string; logo?: string }>>([]);

  readonly activeBuyerKey = signal<string | null>(null);
  readonly activeDetail = signal<MarketerCustomerDetail | null>(null);

  readonly search = signal('');
  readonly storeFilter = signal('all');
  readonly lifecycleFilter = signal('all');
  readonly segmentFilter = signal('all');
  readonly marketingFilter = signal('all');

  readonly selectedBuyerKeys = signal<string[]>([]);
  readonly composeChannel = signal<ComposeChannel>('email');
  readonly composeSubject = signal('New offer for your next order');
  readonly composeMessage = signal('Hi there, we have new arrivals and exclusive savings waiting for you. Reply if you would like a tailored recommendation.');
  readonly campaignName = signal('Follow-up outreach');
  readonly activeTemplate = signal('new-arrivals');

  readonly detailLifecycle = signal<LifecycleStage>('new');
  readonly detailNotes = signal('');
  readonly detailMarketingOptIn = signal(true);
  readonly detailPreferredChannels = signal<Array<'email' | 'sms'>>([]);
  readonly detailLastCampaignName = signal('');

  private loadedMarketerId = '';

  readonly composeTemplates: ComposeTemplate[] = [
    {
      id: 'new-arrivals',
      label: 'New arrivals',
      subject: 'Fresh picks are live in our store',
      message: 'Hi {{firstName}}, we just added new products we think you will love. Take a look and let us know if you want a recommendation.',
    },
    {
      id: 'restock',
      label: 'Restock',
      subject: 'Popular items are back in stock',
      message: 'Hi {{firstName}}, the items our customers ask for most are back. If you want one reserved, reply and we will help right away.',
    },
    {
      id: 'vip',
      label: 'VIP thank-you',
      subject: 'A thank-you for shopping with us',
      message: 'Hi {{firstName}}, thanks for being one of our top customers. We have a priority offer ready for your next order.',
    },
    {
      id: 'win-back',
      label: 'Win back',
      subject: 'We would love to have you back',
      message: 'Hi {{firstName}}, it has been a little while since your last order. We have something new we think is worth a look.',
    },
  ];

  readonly selectedCustomers = computed(() => {
    const selected = new Set(this.selectedBuyerKeys());
    return this.customers().filter((customer) => selected.has(customer.buyerKey));
  });

  readonly optedInSelectedCustomers = computed(() => {
    return this.selectedCustomers().filter((customer) => customer.marketingOptIn);
  });

  readonly activeBuyer = computed(() => {
    const key = this.activeBuyerKey();
    return this.customers().find((customer) => customer.buyerKey === key) || null;
  });

  readonly marketingAudience = computed(() => {
    const selected = this.optedInSelectedCustomers();
    if (selected.length > 0) {
      return selected;
    }

    const active = this.activeBuyer();
    return active && active.marketingOptIn ? [active] : [];
  });

  readonly recipientEmails = computed(() => {
    return [...new Set(
      this.marketingAudience()
        .map((customer) => customer.email)
        .filter(Boolean)
    )];
  });

  readonly recipientPhones = computed(() => {
    return [...new Set(
      this.marketingAudience()
        .map((customer) => customer.phone || '')
        .filter(Boolean)
    )];
  });

  readonly currencyCode = computed(() => {
    const user = this.user();
    return user?.wallets?.marketer?.currency || 'NGN';
  });

  constructor() {
    effect(() => {
      const user = this.user();
      if (user?._id && this.loadedMarketerId !== user._id) {
        this.loadedMarketerId = user._id;
        this.loadCustomers(true);
      }
    });
  }

  loadCustomers(resetPage = false): void {
    const marketer = this.user();
    if (!marketer?._id) {
      this.loading.set(false);
      return;
    }

    if (resetPage) {
      this.pagination.update((current) => ({ ...current, page: 1 }));
    }

    this.loading.set(true);
    const pagination = this.pagination();

    this.customerService.getMarketerCustomers(marketer._id, {
      page: pagination.page,
      limit: pagination.limit,
      search: this.search().trim(),
      storeId: this.storeFilter() !== 'all' ? this.storeFilter() : undefined,
      lifecycleStage: this.lifecycleFilter(),
      marketingOptIn: this.marketingFilter(),
      segment: this.segmentFilter(),
      sortBy: 'lastOrderAt',
      sortOrder: 'desc',
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const data = response.data;
          this.customers.set(data.customers || []);
          this.summary.set(data.summary || this.summary());
          this.pagination.set(data.pagination || this.pagination());
          this.storeOptions.set(data.filters?.stores || []);
          this.syncSelectedBuyers();

          if (!this.activeBuyerKey() && data.customers?.length) {
            this.selectBuyer(data.customers[0].buyerKey);
          } else if (this.activeBuyerKey() && !data.customers.some((customer) => customer.buyerKey === this.activeBuyerKey())) {
            this.activeBuyerKey.set(null);
            this.activeDetail.set(null);
          }

          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load marketer customers:', error);
          this.loading.set(false);
          this.snackBar.open(error?.error?.message || 'Failed to load customers.', 'Close', { duration: 4000 });
        },
      });
  }

  refresh(): void {
    this.loadCustomers(false);
    if (this.activeBuyerKey()) {
      this.loadBuyerDetail(this.activeBuyerKey() as string, false);
    }
  }

  previousPage(): void {
    if (this.pagination().page <= 1 || this.loading()) {
      return;
    }

    this.pagination.update((current) => ({ ...current, page: current.page - 1 }));
    this.loadCustomers(false);
  }

  nextPage(): void {
    if (this.pagination().page >= this.pagination().totalPages || this.loading()) {
      return;
    }

    this.pagination.update((current) => ({ ...current, page: current.page + 1 }));
    this.loadCustomers(false);
  }

  selectBuyer(buyerKey: string): void {
    if (!buyerKey) {
      return;
    }

    this.activeBuyerKey.set(buyerKey);
    this.loadBuyerDetail(buyerKey, true);
  }

  loadBuyerDetail(email: string, setLoading = true): void {
    const marketer = this.user();
    if (!marketer?._id || !email) {
      return;
    }

    if (setLoading) {
      this.detailLoading.set(true);
    }

    this.customerService.getMarketerCustomerDetail(marketer._id, email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.activeDetail.set(response.data);
          this.setDetailDrafts(response.data);
          this.detailLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load customer detail:', error);
          this.detailLoading.set(false);
          this.snackBar.open(error?.error?.message || 'Failed to load customer detail.', 'Close', { duration: 4000 });
        },
      });
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.loadCustomers(true);
  }

  toggleBuyerSelection(buyerKey: string, checked: boolean): void {
    const current = new Set(this.selectedBuyerKeys());
    if (checked) {
      current.add(buyerKey);
    } else {
      current.delete(buyerKey);
    }
    this.selectedBuyerKeys.set([...current]);
  }

  toggleSelectAllVisible(checked: boolean): void {
    if (checked) {
      this.selectedBuyerKeys.set(this.customers().map((customer) => customer.buyerKey));
      return;
    }

    this.selectedBuyerKeys.set([]);
  }

  allVisibleSelected(): boolean {
    return this.customers().length > 0 && this.customers().every((customer) => this.isBuyerSelected(customer.buyerKey));
  }

  isBuyerSelected(buyerKey: string): boolean {
    return this.selectedBuyerKeys().includes(buyerKey);
  }

  clearSelection(): void {
    this.selectedBuyerKeys.set([]);
  }

  setComposeTemplate(templateId: string): void {
    const template = this.composeTemplates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    this.activeTemplate.set(template.id);
    this.composeSubject.set(template.subject);
    this.composeMessage.set(template.message);
  }

  async copyRecipients(kind: 'emails' | 'phones'): Promise<void> {
    const values = kind === 'emails' ? this.recipientEmails() : this.recipientPhones();
    if (!values.length) {
      this.snackBar.open(`No ${kind} available for the current audience.`, 'Close', { duration: 3200 });
      return;
    }

    await this.copyText(values.join(kind === 'emails' ? ', ' : ', '), `${kind === 'emails' ? 'Email' : 'Phone'} list copied.`);
  }

  async copyMessage(): Promise<void> {
    await this.copyText(this.interpolateMessage(this.composeMessage()), 'Campaign message copied.');
  }

  launchEmailDraft(): void {
    const recipients = this.recipientEmails();
    if (!recipients.length) {
      this.snackBar.open('Select at least one opted-in customer with an email address.', 'Close', { duration: 3500 });
      return;
    }

    const bcc = recipients.slice(0, 25).join(',');
    const subject = encodeURIComponent(this.composeSubject());
    const body = encodeURIComponent(this.interpolateMessage(this.composeMessage()));
    window.location.href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${subject}&body=${body}`;
  }

  launchSmsDraft(customer?: MarketerCustomerRecord | null): void {
    const c = customer || this.activeBuyer();
    if (c?.phone) {
      this.openSendSms(c);
      return;
    }
    const phones = this.recipientPhones();
    if (phones.length > 1) {
      this.openBulkSms();
      return;
    }
    if (phones.length === 1) {
      this.openSendSms({ phone: phones[0], fullName: phones[0], email: '' } as any);
      return;
    }
    this.snackBar.open('Select at least one opted-in customer with a phone number.', 'Close', { duration: 3500 });
  }

  openSendSms(customer: MarketerCustomerRecord): void {
    if (!customer.phone) {
      this.snackBar.open('Customer has no phone number.', 'Close', { duration: 3000 });
      return;
    }
    this.dialog.open(SupportSmsDialogComponent, {
      width: '420px', data: {
        email: customer.email,
        phone: customer.phone,
        name: customer.fullName || customer.email,
        marketerId: this.user()?._id || '',
      } as SmsDialogData,
    }).afterClosed().subscribe(sent => { if (sent) this.loadCustomers(false); });
  }

  openBulkSms(): void {
    const selected = this.selectedCustomers();
    const optedIn = selected.filter(c => c.marketingOptIn && c.phone);
    const allOptedIn = this.customers().filter(c => c.marketingOptIn && c.phone);
    const recipients = optedIn.length > 0 ? optedIn : allOptedIn;
    if (!recipients.length) {
      this.snackBar.open('No opted-in customers with phone numbers.', 'Close', { duration: 3500 });
      return;
    }
    this.dialog.open(SupportBulkSmsDialogComponent, {
      width: '480px', data: {
        emails: recipients.map(c => c.email),
        count: recipients.length,
        preview: recipients.slice(0, 5).map(c => ({ name: c.fullName || c.email, phone: c.phone! })),
        marketerId: this.user()?._id || '',
      } as BulkSmsDialogData,
    }).afterClosed().subscribe(sent => { if (sent) this.loadCustomers(false); });
  }

  openIndividualEmail(customer: MarketerCustomerRecord): void {
    if (!customer.email || !customer.marketingOptIn) {
      this.snackBar.open('This customer is not available for email marketing.', 'Close', { duration: 3200 });
      return;
    }

    const subject = encodeURIComponent(this.composeSubject());
    const body = encodeURIComponent(this.interpolateMessage(this.composeMessage(), customer));
    window.location.href = `mailto:${encodeURIComponent(customer.email)}?subject=${subject}&body=${body}`;
  }

  async copyCustomerContact(customer: MarketerCustomerRecord): Promise<void> {
    const contact = [customer.fullName, customer.email, customer.phone].filter(Boolean).join(' | ');
    await this.copyText(contact, 'Customer contact copied.');
  }

  saveCustomerRecord(): void {
    const marketer = this.user();
    const detail = this.activeDetail();
    if (!marketer?._id || !detail?.buyer?.email) {
      return;
    }

    this.savingDetail.set(true);
    this.customerService.updateMarketerCustomerMeta(marketer._id, {
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
          this.snackBar.open('Customer record updated.', 'Close', { duration: 2800 });
          this.savingDetail.set(false);
          this.loadCustomers(false);
          this.loadBuyerDetail(detail.buyer.email, false);
        },
        error: (error) => {
          console.error('Failed to save customer record:', error);
          this.savingDetail.set(false);
          this.snackBar.open(error?.error?.message || 'Unable to save customer record.', 'Close', { duration: 3600 });
        },
      });
  }

  exportVisibleCustomers(): void {
    this.exportCustomers(this.customers(), 'store-customers');
  }

  exportSelectedCustomers(): void {
    const selected = this.selectedCustomers();
    if (!selected.length) {
      this.snackBar.open('Select customers first to export a focused list.', 'Close', { duration: 3200 });
      return;
    }

    this.exportCustomers(selected, 'selected-store-customers');
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

  visibleAudienceCount(): number {
    return this.marketingAudience().length;
  }

  summaryCardRows(): Array<{ label: string; value: string; icon: string; tone: string }> {
    const summary = this.summary();
    return [
      { label: 'Customers', value: `${summary.totalCustomers || 0}`, icon: 'groups', tone: 'primary' },
      { label: 'Opted In', value: `${summary.optedInCustomers || 0}`, icon: 'mark_email_read', tone: 'success' },
      { label: 'Repeat Buyers', value: `${summary.repeatCustomers || 0}`, icon: 'repeat', tone: 'accent' },
      { label: 'Revenue', value: `${summary.totalRevenue || 0}`, icon: 'payments', tone: 'warning' },
    ];
  }

  customerHeadline(customer: MarketerCustomerRecord): string {
    return customer.fullName || customer.email || 'Buyer';
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

  private setDetailDrafts(detail: MarketerCustomerDetail): void {
    this.detailLifecycle.set(detail.buyer.lifecycleStage || 'new');
    this.detailNotes.set(detail.buyer.notes || '');
    this.detailMarketingOptIn.set(detail.buyer.marketingOptIn !== false);
    this.detailPreferredChannels.set(detail.buyer.preferredChannels || []);
    this.detailLastCampaignName.set(detail.buyer.lastCampaignName || '');
  }

  private syncSelectedBuyers(): void {
    const available = new Set(this.customers().map((customer) => customer.buyerKey));
    this.selectedBuyerKeys.set(this.selectedBuyerKeys().filter((buyerKey) => available.has(buyerKey)));
  }

  private interpolateMessage(message: string, customer?: Pick<MarketerCustomerRecord, 'fullName'> | null): string {
    const recipient = customer || this.activeBuyer();
    const firstName = recipient?.fullName?.split(' ')?.[0] || 'there';
    return message.replaceAll('{{firstName}}', firstName);
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

  private exportCustomers(customers: MarketerCustomerRecord[], prefix: string): void {
    const rows = [
      ['Name', 'Email', 'Phone', 'Opted In', 'Lifecycle Stage', 'Segment', 'Order Count', 'Total Spent', 'Average Order Value', 'Linked Stores', 'Last Order', 'Tags'],
      ...customers.map((customer) => ([
        customer.fullName || '',
        customer.email || '',
        customer.phone || '',
        customer.marketingOptIn ? 'Yes' : 'No',
        customer.lifecycleStage || '',
        customer.behaviorSegment || '',
        String(customer.orderCount || 0),
        String(customer.totalSpent || 0),
        String(customer.averageOrderValue || 0),
        customer.linkedStores.map((store) => store.name).join(' | '),
        customer.lastOrderAt || '',
        (customer.tags || []).join(' | '),
      ])),
    ];

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private async copyText(text: string, successMessage: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.snackBar.open(successMessage, 'Close', { duration: 2500 });
    } catch (error) {
      console.error('Clipboard write failed:', error);
      this.snackBar.open('Copy failed on this device.', 'Close', { duration: 3200 });
    }
  }
}
