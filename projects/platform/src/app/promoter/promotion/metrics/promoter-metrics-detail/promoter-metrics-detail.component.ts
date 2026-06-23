import { CommonModule, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollaborationService } from '../../../../campaign/collaboration/collaboration.service';
import { UserService } from '../../../../common/services/user.service';

@Component({
  selector: 'app-promoter-metrics-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, MatSnackBarModule, MatTooltipModule],
  providers: [DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './promoter-metrics-detail.component.html',
  styleUrls: ['./promoter-metrics-detail.component.scss'],
})
export class PromoterMetricsDetailComponent {
  private readonly collaborationService = inject(CollaborationService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly decimalPipe = inject(DecimalPipe);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly campaignTitle = signal('');
  readonly campaignStatus = signal('');
  readonly campaignId = signal('');
  readonly summary = signal({ totalViews: 0, totalLeads: 0, totalContactMe: 0, totalFormViews: 0, totalFailures: 0, conversionRate: 0 });
  readonly promotionBreakdown = signal<any[]>([]);
  readonly dailySeries = signal<any[]>([]);
  readonly generatedAt = signal<string | null>(null);

  readonly filtersForm = this.fb.nonNullable.group({ range: ['30'], startDate: [''], endDate: [''] });
  readonly hasPromotions = computed(() => this.promotionBreakdown().length > 0);
  readonly hasDailyData = computed(() => this.dailySeries().length > 0);

  constructor() {
    this.route.paramMap.pipe(switchMap(p => { this.campaignId.set(p.get('campaignId') || ''); return this.route.queryParams; }), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadData());
    this.filtersForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => { if (v.range !== 'custom' && (v.startDate || v.endDate)) this.filtersForm.patchValue({ startDate: '', endDate: '' }, { emitEvent: false }); this.loadData(); });
  }

  goBack(): void { this.router.navigate(['/dashboard/campaigns/promotions/metrics']); }
  refreshNow(): void { this.loadData(); }
  clearFilters(): void { this.filtersForm.setValue({ range: '30', startDate: '', endDate: '' }); }
  formatNumber(v: number, d: number = 0): string { const f = d > 0 ? `1.${d}-${d}` : '1.0-0'; return this.decimalPipe.transform(v || 0, f) || '0'; }
  trackByPromotionId(_i: number, r: any): string { return r.promotionId || r.upi || ''; }
  trackByDate(_i: number, r: any): string { return r.date; }

  private loadData(): void {
    const uid = this.userService.user()?._id;
    const cid = this.campaignId();
    if (!uid || !cid) return;
    this.loading.set(true); this.error.set(null);
    const raw = this.filtersForm.getRawValue();
    this.collaborationService.getPromoterMetricsDetail(uid, cid, { range: raw.range, startDate: raw.range === 'custom' ? raw.startDate || null : null, endDate: raw.range === 'custom' ? raw.endDate || null : null })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({ next: r => { const d = r.data; this.campaignTitle.set(d.campaign.title); this.campaignStatus.set(d.campaign.status); this.summary.set(d.summary); this.promotionBreakdown.set(d.promotionBreakdown); this.dailySeries.set(d.dailySeries); this.generatedAt.set(r.generatedAt); }, error: e => { this.error.set(e?.error?.message || 'Could not load details.'); this.snackBar.open(this.error()!, 'Close', { duration: 3200 }); } });
  }
}
