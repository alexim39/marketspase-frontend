import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, timer, timeout } from 'rxjs';
import { UserService } from '../../../common/services/user.service';
import {
  FraudCaseStatus,
  FraudRiskLevel,
  PromotionComplianceService,
  PromotionFraudCase,
  PromoterFraudProfile,
} from './promotion-compliance.service';

type HealthTone = 'good' | 'warn' | 'bad';
type PromotionAccessTone = 'good' | 'warn' | 'bad';
type RiskTone = 'low' | 'medium' | 'high' | 'critical';

interface GroupedPromotionIncident {
  promotionId: string;
  upi: string;
  campaignTitle: string;
  lastStatus: FraudCaseStatus;
  lastRiskLevel: FraudRiskLevel;
  lastUpdatedAt?: string;
  incidentCount: number;
  suspensionCount: number;
  openCount: number;
  cases: PromotionFraudCase[];
}

@Component({
  selector: 'app-promotion-compliance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatChipsModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './promotion-compliance.component.html',
  styleUrls: ['./promotion-compliance.component.scss'],
})
export class PromotionComplianceComponent {
  private readonly requestTimeoutMs = 15_000;
  private readonly userService = inject(UserService);
  private readonly service = inject(PromotionComplianceService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);

  readonly currentUser = this.userService.user;

  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly error = signal<string | null>(null);
  readonly generatedAt = signal<string | null>(null);

  readonly fraudProfile = signal<PromoterFraudProfile | null>(null);
  readonly summary = signal<{
    totalCases: number;
    activeCases: number;
    suspendedCases: number;
    blockedPromotions: number;
    statusCounts: Record<string, number>;
  } | null>(null);

  readonly cases = signal<PromotionFraudCase[]>([]);
  readonly pagination = signal({ page: 1, limit: 25, total: 0, totalPages: 0 });

  readonly filtersForm = this.fb.nonNullable.group({
    status: ['all' as FraudCaseStatus],
    riskLevel: ['all' as FraudRiskLevel],
    search: [''],
  });

  readonly healthTone = computed<HealthTone>(() => {
    const profile = this.fraudProfile();
    const summary = this.summary();
    const risk = String(profile?.riskLevel || 'low').toLowerCase();
    const suspendedUntil = profile?.suspendedUntil ? new Date(profile.suspendedUntil) : null;
    const isSuspendedNow = suspendedUntil ? suspendedUntil.getTime() > Date.now() : false;

    if (isSuspendedNow || risk === 'critical' || (summary?.blockedPromotions || 0) > 0) return 'bad';
    if (risk === 'high' || (summary?.activeCases || 0) > 0) return 'warn';
    return 'good';
  });

  readonly riskTone = computed<RiskTone>(() => {
    const risk = String(this.fraudProfile()?.riskLevel || 'low').toLowerCase();
    if (risk === 'critical') return 'critical';
    if (risk === 'high') return 'high';
    if (risk === 'medium') return 'medium';
    return 'low';
  });

  readonly headline = computed(() => {
    const tone = this.healthTone();
    if (tone === 'bad') return 'Account Health: Action Required';
    if (tone === 'warn') return 'Account Health: Improve Your Traffic Quality';
    return 'Account Health: Good Standing';
  });

  readonly warningCopy = computed(() => {
    const profile = this.fraudProfile();
    const summary = this.summary();
    const risk = String(profile?.riskLevel || 'low').toLowerCase();
    const suspendedUntil = profile?.suspendedUntil ? new Date(profile.suspendedUntil) : null;
    const isSuspendedNow = suspendedUntil ? suspendedUntil.getTime() > Date.now() : false;

    if (isSuspendedNow) {
      const until = this.datePipe.transform(profile?.suspendedUntil, 'medium') || 'soon';
      return `Your promoter account is currently suspended until ${until}. While suspended you may receive fewer campaigns and your earnings can be restricted.`;
    }

    if (risk === 'critical' || risk === 'high' || (summary?.activeCases || 0) > 0) {
      return 'We detected suspicious click activity linked to one or more promotions. Repeated issues reduce your trust score, lower your payout rate, and can limit campaign access.';
    }

    return 'We continuously monitor promotion links for suspicious clicks. Keep sharing to real buyers and avoid repeated/self clicks to protect your trust score.';
  });

  readonly trustScore = computed(() => {
    const score = Number(this.fraudProfile()?.trustScore ?? 100);
    return Math.max(0, Math.min(score, 100));
  });

  readonly trustScoreLabel = computed(() => `${this.trustScore()} / 100`);

  readonly accountStatusLabel = computed(() => {
    const until = this.fraudProfile()?.suspendedUntil;
    if (!until) return 'Active';
    const dt = new Date(until);
    return Number.isFinite(dt.getTime()) && dt.getTime() > Date.now() ? 'Restricted' : 'Active';
  });

  readonly groupedIncidents = computed<GroupedPromotionIncident[]>(() => {
    const term = this.filtersForm.controls.search.value.trim().toLowerCase();
    const allCases = this.cases();
    const map = new Map<string, GroupedPromotionIncident>();

    for (const item of allCases) {
      const promotionId = item.promotion?._id;
      if (!promotionId) continue;

      const upi = String(item.promotion?.upi || '').trim();
      const campaignTitle = String(item.campaign?.title || 'Campaign').trim();
      const key = promotionId;

      const existing = map.get(key);
      const isOpen = ['open', 'warning_sent', 'final_warning_sent', 'suspended'].includes(String(item.status));
      const isSuspension = Boolean(item.suspendedAt);
      const updatedAt = item.updatedAt || item.createdAt || undefined;

      if (!existing) {
        map.set(key, {
          promotionId,
          upi: upi || promotionId,
          campaignTitle,
          lastStatus: item.status,
          lastRiskLevel: item.riskLevel,
          lastUpdatedAt: updatedAt,
          incidentCount: 1,
          suspensionCount: isSuspension ? 1 : 0,
          openCount: isOpen ? 1 : 0,
          cases: [item],
        });
        continue;
      }

      existing.incidentCount += 1;
      existing.suspensionCount += isSuspension ? 1 : 0;
      existing.openCount += isOpen ? 1 : 0;
      existing.cases.push(item);

      if (!existing.lastUpdatedAt || (updatedAt && new Date(updatedAt) > new Date(existing.lastUpdatedAt))) {
        existing.lastUpdatedAt = updatedAt;
        existing.lastStatus = item.status;
        existing.lastRiskLevel = item.riskLevel;
        existing.campaignTitle = campaignTitle || existing.campaignTitle;
        existing.upi = upi || existing.upi;
      }
    }

    const rows = Array.from(map.values()).sort((a, b) => {
      const ad = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
      const bd = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
      return bd - ad;
    });

    if (!term) return rows;
    return rows.filter((row) =>
      `${row.upi} ${row.campaignTitle} ${row.lastStatus} ${row.lastRiskLevel}`.toLowerCase().includes(term)
    );
  });

  constructor() {
    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(200))
      .subscribe((value) => {
        // Only status/riskLevel trigger server reload. "search" is client-side.
        const { status, riskLevel } = value;
        this.loadCases(true, { status, riskLevel });
      });

    effect((onCleanup) => {
      const userId = this.currentUser()?._id;
      if (!userId) return;

      // Prevent signal reads inside loadSummary/loadCases from becoming dependencies of this effect.
      // (Otherwise pagination/loading updates can retrigger the effect, causing flicker/loops.)
      untracked(() => {
        this.loadSummary();
        this.loadCases();
      });

      const sub = timer(5 * 60 * 1000, 5 * 60 * 1000)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          untracked(() => {
            this.loadSummary(true);
            this.loadCases(true);
          });
        });

      onCleanup(() => sub.unsubscribe());
    });
  }

  refreshNow(): void {
    this.loadSummary(true);
    this.loadCases(true);
  }

  private loadSummary(silent = false): void {
    const userId = this.currentUser()?._id;
    if (!userId) {
      this.loading.set(false);
      this.refreshing.set(false);
      this.error.set('Unable to resolve your account. Please reload and try again.');
      return;
    }

    if (silent) this.refreshing.set(true);
    this.error.set(null);

    this.service
      .getSummary(userId)
      .pipe(timeout(this.requestTimeoutMs))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (!resp?.success) {
            this.error.set(resp?.message || 'Unable to load account health.');
            this.loading.set(false);
            this.refreshing.set(false);
            return;
          }

          this.fraudProfile.set(resp.data.fraudProfile);
          this.summary.set(resp.data.summary);
          this.generatedAt.set(resp.generatedAt || null);
          // Summary can succeed even if cases are still loading; keep the screen moving.
          if (this.loading()) this.loading.set(false);
          this.refreshing.set(false);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Unable to load account health.';
          this.error.set(msg);
          this.loading.set(false);
          this.refreshing.set(false);
          this.snackBar.open(msg, 'Close', { duration: 3500 });
        },
      });
  }

  private loadCases(
    silent = false,
    override?: { status?: FraudCaseStatus; riskLevel?: FraudRiskLevel }
  ): void {
    const userId = this.currentUser()?._id;
    if (!userId) {
      this.loading.set(false);
      this.refreshing.set(false);
      this.error.set('Unable to resolve your account. Please reload and try again.');
      return;
    }

    if (silent) {
      this.refreshing.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    const filters = this.filtersForm.getRawValue();
    const status = override?.status ?? filters.status;
    const riskLevel = override?.riskLevel ?? filters.riskLevel;

    this.service
      .getCases(userId, {
        status,
        riskLevel,
        page: 1,
        limit: this.pagination().limit,
      })
      .pipe(timeout(this.requestTimeoutMs))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          if (!resp?.success) {
            this.error.set(resp?.message || 'Unable to load compliance cases.');
            this.loading.set(false);
            this.refreshing.set(false);
            return;
          }

          this.cases.set(resp.data.cases || []);
          this.pagination.set(resp.data.pagination);
          this.generatedAt.set(resp.generatedAt || this.generatedAt());
          this.loading.set(false);
          this.refreshing.set(false);
        },
        error: (err) => {
          const msg = err?.error?.message || 'Unable to load compliance cases.';
          this.error.set(msg);
          this.loading.set(false);
          this.refreshing.set(false);
          this.snackBar.open(msg, 'Close', { duration: 3500 });
        },
      });
  }

  formatPercent(value: number, digits = 0): string {
    const n = Number(value || 0);
    const format = digits > 0 ? `1.${digits}-${digits}` : '1.0-0';
    return `${this.decimalPipe.transform(n, format) || '0'}%`;
  }

  formatDate(value?: string | null, fmt = 'medium'): string {
    if (!value) return '--';
    return this.datePipe.transform(value, fmt) || '--';
  }

  statusLabel(status: FraudCaseStatus): string {
    const s = String(status || '').toLowerCase();
    if (s === 'warning_sent') return 'Warning';
    if (s === 'final_warning_sent') return 'Final warning';
    if (s === 'suspended') return 'Suspended';
    if (s === 'resolved') return 'Resolved';
    if (s === 'dismissed') return 'Dismissed';
    if (s === 'open') return 'Open review';
    return status;
  }

  riskLabel(risk: FraudRiskLevel): string {
    const s = String(risk || '').toLowerCase();
    if (s === 'low') return 'Low';
    if (s === 'medium') return 'Medium';
    if (s === 'high') return 'High';
    if (s === 'critical') return 'Critical';
    return risk;
  }

  promotionAccess(promo: PromotionFraudCase['promotion'] | null): { label: string; tone: PromotionAccessTone } {
    if (!promo) return { label: 'Unavailable', tone: 'warn' };

    const reviewStatus = String(promo.fraudStatus?.reviewStatus || '').toLowerCase();
    const isActive = promo.isActive !== false;

    if (!isActive || reviewStatus === 'blocked') return { label: 'Banned', tone: 'bad' };
    if (reviewStatus === 'final_warning') return { label: 'Final warning', tone: 'bad' };
    if (reviewStatus === 'warning') return { label: 'Warning', tone: 'warn' };
    if (reviewStatus === 'resolved') return { label: 'Resolved', tone: 'good' };
    if (reviewStatus === 'clear') return { label: 'Clear', tone: 'good' };

    return { label: reviewStatus ? reviewStatus.replace(/_/g, ' ') : 'Active', tone: 'good' };
  }
}
