import { Component, inject, OnInit, OnDestroy, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { takeUntil } from 'rxjs';

import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CampaignService } from './campaign.service';
import { Router } from '@angular/router';
import { AdminService } from '../common/services/user.service';
import { CampaignInterface } from '../../../../shared-services/src/public-api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'admin-campaign-mgt',
  standalone: true,
  providers: [CampaignService, DatePipe, CurrencyPipe],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatIconModule, MatButtonModule,
    MatCardModule, MatTooltipModule, MatChipsModule, MatProgressSpinnerModule,
    MatDialogModule, MatSnackBarModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule, MatExpansionModule,
    MatMenuModule, MatBadgeModule, MatProgressBarModule
  ],
  templateUrl: './campaign.component.html',
  styleUrls: ['./campaign.component.scss'],
})
export class CampaignMgtComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  readonly campaignService = inject(CampaignService);
  readonly router = inject(Router);
  readonly snackBar = inject(MatSnackBar);
  readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly totalCampaigns = signal(0);
  readonly activeCampaigns = signal(0);
  readonly pendingCampaigns = signal(0);
  readonly completedCampaigns = signal(0);
  readonly rejectedCampaigns = signal(0);
  readonly categories = signal<string[]>([]);

  readonly dataSource = new MatTableDataSource<CampaignInterface>([]);

  readonly filtersForm = this.fb.group({
    status: [[] as string[]],
    category: [''],
    search: ['']
  });

  readonly currentPage = signal(1);
  readonly pageSize = signal(50);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  activeMenuCampaign: CampaignInterface | null = null;

  readonly statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'pending', label: 'Pending' },
    { value: 'paused', label: 'Paused' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'completed', label: 'Completed' },
    { value: 'exhausted', label: 'Exhausted' },
    { value: 'expired', label: 'Expired' }
  ];

  readonly selectedStatuses = computed(() => {
    return this.filtersForm.controls.status.value as string[] || [];
  });

  readonly pageNumbers = computed(() => {
    const total = Math.max(1, this.totalPages());
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  });

  ngOnInit(): void {
    this.adminService.fetchAdmin();
    this.loadCampaigns();

    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadCampaigns();
      });
  }

  loadCampaigns(): void {
    this.isLoading.set(true);
    const filters = this.filtersForm.value;
    this.campaignService.getAppCampaigns(this.currentPage(), this.pageSize(), filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.dataSource.data = response.data;
            this.totalItems.set(response.pagination?.total ?? response.data.length);
            this.totalPages.set(response.pagination?.pages ?? 1);
            this.calculateStats(response.data);
            this.extractCategories(response.data);
          } else {
            this.snackBar.open('Failed to load campaigns', 'Close', { duration: 3000 });
          }
          this.isLoading.set(false);
        },
        error: () => {
          this.snackBar.open('Error loading campaigns', 'Close', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
  }

  calculateStats(campaigns: CampaignInterface[]): void {
    this.totalCampaigns.set(campaigns.length);
    this.activeCampaigns.set(campaigns.filter(c => c.status === 'active').length);
    this.pendingCampaigns.set(campaigns.filter(c => c.status === 'pending').length);
    this.rejectedCampaigns.set(campaigns.filter(c => c.status === 'rejected').length);
    this.completedCampaigns.set(
      campaigns.filter(c => ['completed', 'exhausted', 'expired', 'rejected'].includes(c.status)).length
    );
  }

  extractCategories(campaigns: CampaignInterface[]): void {
    const set = new Set(campaigns.map(c => c.category).filter(Boolean));
    this.categories.set(Array.from(set) as string[]);
  }

  applyFormFilters(): void {
    this.currentPage.set(1);
    this.loadCampaigns();
  }

  toggleStatusFilter(value: string): void {
    const current = this.filtersForm.controls.status.value as string[] || [];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    this.filtersForm.controls.status.setValue(next);
    this.applyFormFilters();
  }

  clearFilters(): void {
    this.filtersForm.controls.status.setValue([]);
    this.filtersForm.controls.category.setValue('');
    this.filtersForm.controls.search.setValue('');
    this.currentPage.set(1);
    this.loadCampaigns();
  }

  viewCampaignDetails(c: CampaignInterface): void { this.router.navigate(['dashboard/campaigns', c._id]); }
  viewPromotions(c: CampaignInterface): void { this.router.navigate(['dashboard/campaigns', c._id, 'promotions']); }
  viewActivityLog(c: CampaignInterface): void { this.router.navigate(['dashboard/campaigns', c._id, 'activity']); }

  approveCampaign(c: CampaignInterface): void {
    this.campaignService.updateCampaignStatus(c._id, 'active', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.snackBar.open('Campaign approved', 'Close', { duration: 3000 }); this.loadCampaigns(); } });
  }

  rejectCampaign(c: CampaignInterface): void {
    this.campaignService.updateCampaignStatus(c._id, 'rejected', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.snackBar.open('Campaign rejected', 'Close', { duration: 3000 }); this.loadCampaigns(); } });
  }

  pauseCampaign(c: CampaignInterface): void {
    this.campaignService.updateCampaignStatus(c._id, 'paused', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.snackBar.open('Campaign paused', 'Close', { duration: 3000 }); this.loadCampaigns(); } });
  }

  resumeCampaign(c: CampaignInterface): void {
    this.campaignService.updateCampaignStatus(c._id, 'active', this.adminService.adminData()?._id || '')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: () => { this.snackBar.open('Campaign resumed', 'Close', { duration: 3000 }); this.loadCampaigns(); } });
  }

  toggleMenu(event: MouseEvent, campaign: CampaignInterface): void {
    event.stopPropagation();
    this.activeMenuCampaign = this.activeMenuCampaign?._id === campaign._id ? null : campaign;
  }

  closeMenu(): void { this.activeMenuCampaign = null; }

  goToPage(page: number): void {
    const target = Math.max(1, Math.min(page, Math.max(1, this.totalPages())));
    if (target === this.currentPage()) return;
    this.currentPage.set(target);
    this.loadCampaigns();
  }

  onPageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const page = parseInt(input.value, 10);
    if (!isNaN(page) && page >= 1 && page <= this.totalPages()) {
      this.goToPage(page);
    }
    input.value = '';
  }

  budgetPercent(spent: number, budget: number): number {
    if (!budget) return 0;
    return Math.min(100, (spent / budget) * 100);
  }

  ngOnDestroy(): void {}
}
