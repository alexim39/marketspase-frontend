import { CommonModule, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CollaborationService, PromoterMetricsRow } from '../../../campaign/collaboration/collaboration.service';
import { UserService } from '../../../common/services/user.service';

@Component({
  selector: 'app-promoter-metrics',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatProgressSpinnerModule, MatSelectModule, MatSnackBarModule, MatTooltipModule],
  providers: [DecimalPipe, TitleCasePipe],
  templateUrl: './promoter-metrics.component.html',
  styleUrls: ['./promoter-metrics.component.scss'],
})
export class PromoterMetricsComponent {
  private readonly collaborationService = inject(CollaborationService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly decimalPipe = inject(DecimalPipe);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly data = signal<{ summary: any; campaignBreakdown: PromoterMetricsRow[]; topCampaign: any } | null>(null);
  readonly generatedAt = signal<string | null>(null);

  readonly filtersForm = this.fb.nonNullable.group({ range: ['30'], startDate: [''], endDate: [''] });

  readonly campaignBreakdown = computed(() => this.data()?.campaignBreakdown ?? []);
  readonly topCampaign = computed(() => this.data()?.topCampaign ?? null);
  readonly hasData = computed(() => this.campaignBreakdown().length > 0);
  readonly totalLeads = computed(() => this.campaignBreakdown().reduce((s, r) => s + (r.leads || 0), 0));
  readonly totalViews = computed(() => this.campaignBreakdown().reduce((s, r) => s + (r.landingViews || 0), 0));
  readonly totalContactMe = computed(() => this.campaignBreakdown().reduce((s, r) => s + (r.contactMe || 0), 0));
  readonly aggregateRate = computed(() => { const v = this.totalViews(); const l = this.totalLeads(); return v > 0 ? Math.round((l / v) * 100) : 0; });

  constructor() {
    this.filtersForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => {
      if (v.range !== 'custom' && (v.startDate || v.endDate)) this.filtersForm.patchValue({ startDate: '', endDate: '' }, { emitEvent: false });
      this.loadData();
    });
    this.loadData();
  }

  loadData(): void { this._load(false); }
  refreshNow(): void { this._load(true); }
  clearFilters(): void { this.filtersForm.setValue({ range: '30', startDate: '', endDate: '' }); }
  navigateToDetail(campaignId: string): void { this.router.navigate(['/dashboard/campaigns/promotions/metrics', campaignId]); }

  formatNumber(v: number, d: number = 0): string {
    const fmt = d > 0 ? `1.${d}-${d}` : '1.0-0';
    return this.decimalPipe.transform(v || 0, fmt) || '0';
  }
  trackById(_i: number, r: PromoterMetricsRow): string { return r.campaignId; }

  private _load(silent: boolean = false): void {
    const userId = this.userService.user()?._id;
    if (!userId) return;
    this.loading.set(true); this.error.set(null);
    const raw = this.filtersForm.getRawValue();
    this.collaborationService.getPromoterMetrics(userId, { range: raw.range, startDate: raw.range === 'custom' ? raw.startDate || null : null, endDate: raw.range === 'custom' ? raw.endDate || null : null })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loading.set(false)))
      .subscribe({ next: (r) => { this.data.set(r.data); this.generatedAt.set(r.generatedAt); }, error: (e) => { this.error.set(e?.error?.message || 'Could not load metrics.'); this.snackBar.open(this.error()!, 'Close', { duration: 3200 }); } });
  }
}
