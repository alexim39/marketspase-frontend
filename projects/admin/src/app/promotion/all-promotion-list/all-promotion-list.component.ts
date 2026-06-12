import { Component, DestroyRef, TemplateRef, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Clipboard } from '@angular/cdk/clipboard';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PromotionService } from '../promotion.service';

interface CampaignSummary {
  _id: string;
  title: string;
  category?: string;
}

interface Promotion {
  _id: string;
  upi: string;
  campaign: string | CampaignSummary;
  promoter: string | { _id?: string; displayName?: string; email?: string; username?: string };
  status: string;
  isActive?: boolean;
  promotionUrl?: string;
  payoutAmount?: number;
  costPerClick?: number;
  acceptedAt?: string;
  paidAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  clickStats?: { totalClicks?: number; billableClicks?: number; invalidClicks?: number; duplicateClicks?: number; earnedAmount?: number; lastClickAt?: string };
  fraudStatus?: { isFlagged?: boolean; reviewStatus?: string; reasonSummary?: string };
  proofMedia?: string[];
  proofViews?: number;
}

interface PageResponse {
  success: boolean;
  data: {
    promotions: Promotion[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
  message?: string;
}

@Component({
  selector: 'admin-promotion-list-mgt',
  standalone: true,
  providers: [PromotionService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatIconModule, MatButtonModule, MatTooltipModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    MatProgressBarModule,
  ],
  templateUrl: './all-promotion-list.component.html',
  styleUrls: ['./all-promotion-list.component.scss'],
})
export class AllPromotionListMgtComponent {
  readonly promotionService = inject(PromotionService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly dialog = inject(MatDialog);
  readonly fb = inject(FormBuilder);
  readonly clipboard = inject(Clipboard);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly isFiltering = signal(false);
  readonly error = signal<string | null>(null);

  readonly promotions = signal<Promotion[]>([]);
  readonly currentPage = signal(1);
  readonly pageSize = signal(50);
  readonly campaigns = signal<CampaignSummary[]>([]);

  activeMenuPromotion: Promotion | null = null;
  dialogRef!: MatDialogRef<any>;
  @ViewChild('promotionDetailsDialog') promotionDetailsDialog!: TemplateRef<any>;
  selectedPromotion = signal<Promotion | null>(null);

  readonly filtersForm = this.fb.group({
    status: ['all' as string],
    campaign: [''],
    search: [''],
    startDate: ['' as string],
    endDate: ['' as string]
  });

  // Bumped on every filter change to make computed() react to form control values
  readonly filterTick = signal(0);

  readonly statusLabel: Record<string, string> = {
    accepted: 'Active Link',
    inactive: 'Inactive Link',
    flagged: 'Under Review',
    paid: 'Legacy Paid',
    rejected: 'Rejected'
  };

  readonly pageNumbers = computed(() => {
    const total = Math.max(1, this.totalPages());
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  readonly statsData = computed(() => {
    const all = this.promotions();
    return {
      total: all.length,
      active: all.filter(p => this.getFilterStatus(p) === 'accepted').length,
      inactive: all.filter(p => this.getFilterStatus(p) === 'inactive').length,
      flagged: all.filter(p => this.getFilterStatus(p) === 'flagged').length,
      paid: all.filter(p => p.status === 'paid').length,
      rejected: all.filter(p => p.status === 'rejected').length,
      billableClicks: all.reduce((s, p) => s + Number(p.clickStats?.billableClicks ?? 0), 0)
    };
  });

  // Client-side date filter (applied on top of promotions signal)
  readonly filteredPromotions = computed(() => {
    const all = this.promotions();
    const _tick = this.filterTick(); // track form filter changes reactively
    const start = this.filtersForm.controls.startDate.value;
    const end = this.filtersForm.controls.endDate.value;
    if (!start && !end) return all;

    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    if (endDate) endDate.setHours(23, 59, 59, 999);

    return all.filter(p => {
      const d = this.getLifecycleDate(p);
      if (!d) return !startDate && !endDate;
      const date = new Date(d);
      if (startDate && date < startDate) return false;
      if (endDate && date > endDate) return false;
      return true;
    });
  });

  readonly filteredCount = computed(() => this.filteredPromotions().length);

  readonly totalItems = computed(() => this.filteredCount());
  readonly totalPages = computed(() => Math.ceil(this.filteredCount() / this.pageSize()) || 1);

  // Track all fetched promotions for stats display; only show current page in UI
  readonly displayedPromotions = computed(() => {
    const all = this.filteredPromotions();
    const page = this.currentPage();
    const size = this.pageSize();
    return all.slice((page - 1) * size, page * size);
  });

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadPromotionsPage();

    // Debounced search input
    this.filtersForm.controls.search.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.filterTick.set(this.filterTick() + 1);
      });

    // Immediate filter on status/campaign change
    this.filtersForm.controls.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.filterTick.set(this.filterTick() + 1);
      });

    this.filtersForm.controls.campaign.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.filterTick.set(this.filterTick() + 1);
      });

    // Debounced date range
    this.filtersForm.controls.startDate.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.currentPage.set(1); this.filterTick.set(this.filterTick() + 1); });

    this.filtersForm.controls.endDate.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.currentPage.set(1); this.filterTick.set(this.filterTick() + 1); });
  }

  private loadCampaigns(): void {
    // Only load campaign list once for the filter dropdown
    this.promotionService.getAllPromotions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            const campaigns = new Map<string, CampaignSummary>();
            for (const p of (response.data || []) as Promotion[]) {
              if (typeof p.campaign === 'object' && p.campaign?._id) {
                campaigns.set(p.campaign._id, p.campaign as CampaignSummary);
              }
            }
            this.campaigns.set(Array.from(campaigns.values()));
          }
        }
      });
  }

  public loadPromotionsPage(): void {
    // Check if the backend supports server-side filtering via getPromotionsByStatus
    const status = this.filtersForm.controls.status.value || 'all';

    if (status !== 'all') {
      this.isLoading.set(true);
      this.isFiltering.set(false);
      this.promotionService.getPromotionsByStatus(status)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              const data = response.data || [];
              this.promotions.set(data);
              this.extractCampaigns(data);
            }
            this.isLoading.set(false);
          },
          error: () => {
            this.error.set('Failed to load promotions');
            this.isLoading.set(false);
          }
        });
      return;
    }

    // All promotions
    this.isLoading.set(true);
    this.isFiltering.set(false);
    this.error.set(null);

    this.promotionService.getAllPromotions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            const data = response.data as Promotion[] || [];
            this.promotions.set(data);
            this.extractCampaigns(data);
          } else {
            this.error.set('Failed to load promotions');
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Error loading promotions');
          this.isLoading.set(false);
        }
      });
  }

  private extractCampaigns(promotions: Promotion[]): void {
    if (this.campaigns().length > 0) return; // Already loaded
    const map = new Map<string, CampaignSummary>();
    for (const p of promotions) {
      if (typeof p.campaign === 'object' && p.campaign?._id) {
        map.set(p.campaign._id, p.campaign as CampaignSummary);
      }
    }
    if (map.size > 0) this.campaigns.set(Array.from(map.values()));
  }

  getFilterStatus(p: Promotion): string {
    if (p.fraudStatus?.isFlagged) return 'flagged';
    if (p.status === 'accepted' && p.isActive === false) return 'inactive';
    return p.status || 'accepted';
  }

  getCampaignTitle(c: string | CampaignSummary): string {
    if (typeof c === 'object') return c?.title || 'Unknown Campaign';
    return this.campaigns().find(cam => cam._id === c)?.title || 'Unknown Campaign';
  }

  getCampaignId(c: string | CampaignSummary): string {
    return typeof c === 'string' ? c : (c?._id || '');
  }

  getPromoterName(p: string | { displayName?: string }): string {
    return typeof p === 'object' ? (p?.displayName || 'Unknown') : 'Unknown';
  }

  getTrackedClicks(p: Promotion): number { return Number(p.clickStats?.totalClicks ?? 0); }
  getBillableClicks(p: Promotion): number { return Number(p.clickStats?.billableClicks ?? 0); }
  getInvalidClicks(p: Promotion): number { return Number(p.clickStats?.invalidClicks ?? 0) + Number(p.clickStats?.duplicateClicks ?? 0); }
  getEarnedAmount(p: Promotion): number { return Number(p.clickStats?.earnedAmount ?? p.payoutAmount ?? 0); }

  getLifecycleDate(p: Promotion): string | undefined {
    return p.clickStats?.lastClickAt || p.acceptedAt || p.paidAt || p.rejectedAt || p.updatedAt || p.createdAt;
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filtersForm.controls.search.setValue(value);
  }

  clearFilters(): void {
    this.filtersForm.reset({ status: 'all', campaign: '', search: '', startDate: '', endDate: '' });
    this.filterTick.set(this.filterTick() + 1);
    this.currentPage.set(1);
    this.loadPromotionsPage();
  }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
    input.value = '';
  }

  toggleMenu(event: MouseEvent, promotion: Promotion): void {
    event.stopPropagation();
    this.activeMenuPromotion = this.activeMenuPromotion?._id === promotion._id ? null : promotion;
  }

  closeMenu(): void { this.activeMenuPromotion = null; }

  viewPromotionDetails(p: Promotion): void {
    this.selectedPromotion.set(p);
    this.dialogRef = this.dialog.open(this.promotionDetailsDialog, {
      width: '640px',
      maxWidth: '94vw'
    });
  }

  copyPromotionLink(p: Promotion): void {
    if (!p.promotionUrl) { this.snackBar.open('No tracking link available', 'Close', { duration: 3000 }); return; }
    this.clipboard.copy(p.promotionUrl);
    this.snackBar.open('Tracking link copied', 'Close', { duration: 2400 });
  }

  openPromotionLink(p: Promotion): void {
    if (!p.promotionUrl) { this.snackBar.open('No tracking link available', 'Close', { duration: 3000 }); return; }
    window.open(p.promotionUrl, '_blank', 'noopener');
  }

  viewCampaignDetails(p: Promotion): void {
    const id = this.getCampaignId(p.campaign);
    if (id) this.router.navigate(['dashboard/campaigns', id]);
  }

  viewCampaignPromotions(p: Promotion): void {
    const id = this.getCampaignId(p.campaign);
    if (id) this.router.navigate(['dashboard/campaigns', id, 'promotions']);
  }

  viewActivityLog(p: Promotion): void {
    this.snackBar.open(`Viewing activity for ${p.upi}`, 'Close', { duration: 2200 });
  }
}
