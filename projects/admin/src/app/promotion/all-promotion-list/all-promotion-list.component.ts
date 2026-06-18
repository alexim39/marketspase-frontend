import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { PromotionService } from '../promotion.service';

interface Promotion { _id: string; upi: string; promotionUrl?: string; publicUrl?: string; isActive?: boolean; status: string; campaign: any; promoter: any; clickStats?: any; fraudStatus?: any; createdAt: string; }

@Component({
  selector: 'admin-promotion-list',
  standalone: true,
  providers: [PromotionService, DatePipe, CurrencyPipe],
  imports: [CommonModule, FormsModule, RouterModule, MatIconModule, MatButtonModule, MatTooltipModule, MatProgressSpinnerModule, MatSnackBarModule, MatProgressBarModule],
  templateUrl: './all-promotion-list.component.html',
  styleUrls: ['./all-promotion-list.component.scss'],
})
export class AllPromotionListMgtComponent implements OnInit {
  private readonly promotionService = inject(PromotionService);
  private readonly snackBar = inject(MatSnackBar);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly promotions = signal<Promotion[]>([]);
  readonly campaigns = signal<{ _id: string; title: string }[]>([]);

  readonly statusFilter = signal('all');
  readonly searchFilter = signal('');
  readonly campaignFilter = signal('all');
  readonly startDate = signal('');
  readonly endDate = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(25);
  readonly totalItems = signal(0);
  readonly totalPages = signal(1);
  readonly pageSizeOptions = [25, 50, 100, 200];

  readonly stats = signal({ total: 0, active: 0, inactive: 0, flagged: 0, billableClicks: 0, totalEarned: 0 });

  // Debounced search
  private searchSubject = new Subject<string>();

  readonly pageNumbers = computed(() => {
    const t = Math.max(1, this.totalPages());
    const c = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, c - 2);
    const end = Math.min(t, c + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  activeMenuPromotion: Promotion | null = null;

  constructor() {
    this.searchSubject.pipe(debounceTime(350), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.currentPage.set(1);
      this.loadPromotions();
    });
  }

  ngOnInit(): void {
    this.loadPromotions();
  }

  loadPromotions(): void {
    this.isLoading.set(true);
    const params: any = { page: this.currentPage(), limit: this.pageSize() };
    if (this.statusFilter() !== 'all') params.status = this.statusFilter();
    if (this.searchFilter().trim()) params.search = this.searchFilter().trim();
    if (this.campaignFilter() !== 'all') params.campaign = this.campaignFilter();
    if (this.startDate()) params.startDate = this.startDate();
    if (this.endDate()) params.endDate = this.endDate();

    this.promotionService.getAllPromotions(params).subscribe({
      next: (r) => {
        const promotions = r.data || [];
        this.promotions.set(promotions);
        this.totalItems.set(r.pagination?.total || 0);
        this.totalPages.set(r.pagination?.pages || Math.ceil(this.totalItems() / this.pageSize()) || 1);
        if (r.stats) {
          this.stats.set({
            total: r.stats.total || 0,
            active: r.stats.accepted || 0,
            inactive: r.stats.inactive || 0,
            flagged: r.stats.flagged || 0,
            billableClicks: 0,
            totalEarned: 0,
          });
        }
        if (!this.campaigns().length && promotions.length) {
          const m = new Map<string, string>();
          promotions.forEach((p: any) => { if (p.campaign?._id && !m.has(p.campaign._id)) m.set(p.campaign._id, p.campaign.title || 'Untitled'); });
          this.campaigns.set(Array.from(m.entries()).map(([_id, title]) => ({ _id, title })));
        }
        this.isLoading.set(false);
      },
      error: () => { this.isLoading.set(false); this.snackBar.open('Failed to load promotions', 'Close', { duration: 3000 }); },
    });
  }

  onStatusChange(v: string): void { this.statusFilter.set(v); this.currentPage.set(1); this.loadPromotions(); }
  onSearchInput(v: string): void { this.searchFilter.set(v); this.searchSubject.next(v); }
  onCampaignChange(v: string): void { this.campaignFilter.set(v); this.currentPage.set(1); this.loadPromotions(); }
  onStartDateChange(v: string): void { this.startDate.set(v); this.currentPage.set(1); this.loadPromotions(); }
  onEndDateChange(v: string): void { this.endDate.set(v); this.currentPage.set(1); this.loadPromotions(); }

  goToPage(page: number): void {
    const t = Math.max(1, Math.min(page, this.totalPages()));
    if (t === this.currentPage()) return;
    this.currentPage.set(t);
    this.loadPromotions();
  }
  onPageInput(e: Event): void { const i = e.target as HTMLInputElement; const p = parseInt(i.value, 10); if (!isNaN(p) && p >= 1 && p <= this.totalPages()) this.goToPage(p); i.value = ''; }
  onPageSizeChange(size: string | number): void { const n = typeof size === 'string' ? parseInt(size, 10) : size; this.pageSize.set(n); this.currentPage.set(1); this.loadPromotions(); }

  clearFilters(): void { this.statusFilter.set('all'); this.searchFilter.set(''); this.campaignFilter.set('all'); this.startDate.set(''); this.endDate.set(''); this.currentPage.set(1); this.loadPromotions(); }

  copyPromotionLink(p: Promotion): void {
    const url = p.publicUrl || p.promotionUrl || '';
    if (!url) { this.snackBar.open('No link available', 'Close', { duration: 2500 }); return; }
    navigator.clipboard.writeText(url).then(() => this.snackBar.open('Link copied', 'Close', { duration: 2000 }));
  }
  openPromotionLink(p: Promotion): void { const url = p.publicUrl || p.promotionUrl; if (url) window.open(url, '_blank'); }
  viewCampaignDetails(p: Promotion): void { const id = this.getCampaignId(p.campaign); if (id) this.router.navigate(['dashboard/campaigns', id]); }
  viewCampaignPromotions(p: Promotion): void { const id = this.getCampaignId(p.campaign); if (id) this.router.navigate(['dashboard/campaigns', id, 'promotions']); }

  togglePromotionActive(p: Promotion): void {
    fetch(`${this.promotionService.api}/api/v1/campaign/admin/promotion/${p._id}/toggle-active`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) { this.snackBar.open(d.message || 'Updated', 'Close', { duration: 2500 }); this.loadPromotions(); } else { this.snackBar.open(d.message || 'Failed', 'Close', { duration: 3000 }); } })
      .catch(() => this.snackBar.open('Network error', 'Close', { duration: 3000 }));
  }

  toggleMenu(e: MouseEvent, p: Promotion): void { e.stopPropagation(); this.activeMenuPromotion = this.activeMenuPromotion?._id === p._id ? null : p; }
  closeMenu(): void { this.activeMenuPromotion = null; }

  private getCampaignId(c: any): string | null { return typeof c === 'string' ? c : c?._id || null; }
}
