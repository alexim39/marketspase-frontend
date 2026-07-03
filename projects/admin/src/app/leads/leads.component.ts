import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { LeadService, LeadRow, LeadStats } from './lead.service';
import { AdminConfirmDialogComponent } from './confirm-dialog.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'admin-campaign-leads',
  standalone: true,
  providers: [LeadService, DatePipe, TitleCasePipe],
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatTooltipModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './leads.component.html',
  styleUrls: ['./leads.component.scss'],
})
export class AdminLeadsComponent implements OnInit {
  readonly leadService = inject(LeadService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly datePipe = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);

  private readonly search$ = new Subject<string>();

  readonly leads = signal<LeadRow[]>([]);
  readonly stats = signal<LeadStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly campaignFilter = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');

  readonly currentPage = signal(1);
  readonly pageSize = signal(20);
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);

  readonly pageSizeOptions = [10, 20, 50, 100];

  readonly totalPagesArray = computed(() =>
    Array.from({ length: Math.min(this.totalPages(), 7) }, (_, i) => i + 1)
  );

  readonly hasFilters = computed(() =>
    !!this.searchQuery() || !!this.campaignFilter() || !!this.startDate() || !!this.endDate()
  );

  ngOnInit(): void {
    this.loadLeads();

    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadLeads();
      });
  }

  loadLeads(): void {
    this.loading.set(true);
    this.error.set(null);

    this.leadService.getLeads(
      this.currentPage(),
      this.pageSize(),
      this.searchQuery(),
      this.campaignFilter(),
      this.startDate(),
      this.endDate(),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.leads.set(res.data?.leads ?? []);
          this.stats.set(res.data?.stats ?? null);
          this.totalItems.set(res.pagination?.total ?? 0);
          this.totalPages.set(res.pagination?.pages ?? 0);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load leads.');
          this.loading.set(false);
          this.snackBar.open('Could not load campaign leads.', 'Close', { duration: 3200 });
        },
      });
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadLeads();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.campaignFilter.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.search$.next('');
    this.currentPage.set(1);
    this.loadLeads();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadLeads();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1);
    this.loadLeads();
  }

  get visiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const pages: number[] = [1];
    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);

    if (current <= 2) end = Math.min(4, total - 1);
    if (current >= total - 1) start = Math.max(total - 3, 2);

    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total - 1) pages.push(-1);
    pages.push(total);
    return pages;
  }

  formatDate(iso: string): string {
    return this.datePipe.transform(iso, 'MMM d, y, h:mm a') || iso;
  }

  lifecycleClass(stage: string): string {
    const map: Record<string, string> = {
      new: 'stage-new', active: 'stage-active', repeat: 'stage-repeat',
      vip: 'stage-vip', at_risk: 'stage-risk', suppressed: 'stage-suppressed',
    };
    return map[stage] || 'stage-new';
  }

  deleteLead(id: string, name: string): void {
    const ref = this.dialog.open(AdminConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Delete Lead',
        message: `Permanently delete lead "${name}"?`,
        detail: 'This action cannot be undone. The lead will be permanently removed.',
      },
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;

      this.leadService.deleteLead(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.snackBar.open(`Lead "${name}" deleted.`, 'Close', { duration: 2400 });
            this.loadLeads();
          },
          error: (err) => {
            this.snackBar.open(err?.error?.message || 'Failed to delete lead.', 'Close', { duration: 3000 });
          },
        });
    });
  }

  trackById(_index: number, item: LeadRow): string {
    return item._id;
  }
}