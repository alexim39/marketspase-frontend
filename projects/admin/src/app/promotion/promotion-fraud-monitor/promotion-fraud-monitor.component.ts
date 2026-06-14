import { Component, DestroyRef, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  PromotionFraudCase,
  PromotionFraudSummary,
  PromotionService,
} from '../promotion.service';

type FraudAction = 'suspend_2_hours' | 'suspend_promotion_indefinitely' | 'reactivate_promotion' | 'mark_resolved' | 'dismiss';

@Component({
  selector: 'admin-promotion-fraud-monitor',
  standalone: true,
  providers: [PromotionService, DatePipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './promotion-fraud-monitor.component.html',
  styleUrls: ['./promotion-fraud-monitor.component.scss'],
})
export class PromotionFraudMonitorComponent {
  private readonly promotionService = inject(PromotionService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('actionDialog') actionDialog!: TemplateRef<unknown>;

  readonly isLoadingSummary = signal(true);
  readonly isLoadingCases = signal(true);
  readonly actionBusy = signal(false);
  readonly summary = signal<PromotionFraudSummary | null>(null);
  readonly cases = signal<PromotionFraudCase[]>([]);
  readonly selectedCase = signal<PromotionFraudCase | null>(null);
  readonly selectedAction = signal<FraudAction | null>(null);
  readonly actionReason = signal('');
  readonly pagination = signal({ page: 1, limit: 12, total: 0, totalPages: 0 });

  private actionDialogRef: MatDialogRef<unknown> | null = null;

  readonly filtersForm = this.fb.group({ status: ['all'], riskLevel: ['all'], search: [''] });

  readonly summaryCards = computed(() => {
    const s = this.summary(); if (!s) return [];
    return [
      { label: 'Open cases', value: s.openCases, icon: 'shield', tone: 'warning' },
      { label: 'Blocked promotions', value: s.blockedPromotions, icon: 'link_off', tone: 'critical' },
      { label: 'Suspended promoters', value: s.suspendedPromoters, icon: 'person_off', tone: 'critical' },
      { label: 'Critical cases', value: s.criticalCases, icon: 'gpp_bad', tone: 'critical' },
    ];
  });

  readonly statusOptions = ['all', 'open', 'warning_sent', 'final_warning_sent', 'suspended', 'resolved', 'dismissed'];
  readonly riskOptions = ['all', 'critical', 'high', 'medium', 'low'];

  constructor() {
    this.loadSummary(); this.loadCases();
    this.filtersForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(() => { this.pagination.update(c => ({ ...c, page: 1 })); this.loadCases(); });
  }

  refresh(): void { this.loadSummary(); this.loadCases(); }

  previousPage(): void { if (this.pagination().page <= 1 || this.isLoadingCases()) return; this.pagination.update(c => ({ ...c, page: c.page - 1 })); this.loadCases(); }
  nextPage(): void { if (this.pagination().page >= this.pagination().totalPages || this.isLoadingCases()) return; this.pagination.update(c => ({ ...c, page: c.page + 1 })); this.loadCases(); }

  openAction(caseItem: PromotionFraudCase, action: FraudAction): void {
    this.selectedCase.set(caseItem); this.selectedAction.set(action); this.actionReason.set('');
    this.actionDialogRef = this.dialog.open(this.actionDialog, { width: '480px', maxWidth: '92vw', panelClass: 'fraud-action-dialog' });
  }
  closeActionDialog(): void { this.actionDialogRef?.close(); this.actionDialogRef = null; this.selectedCase.set(null); this.selectedAction.set(null); this.actionReason.set(''); }

  confirmAction(): void {
    const sc = this.selectedCase(); const sa = this.selectedAction(); if (!sc || !sa) return;
    this.actionBusy.set(true);
    this.promotionService.applyFraudCaseAction(sc._id, sa, this.actionReason()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.snackBar.open('Fraud case updated.', 'OK', { duration: 3000 }); this.actionBusy.set(false); this.closeActionDialog(); this.loadSummary(); this.loadCases(); },
      error: () => { this.snackBar.open('Unable to update fraud case.', 'OK', { duration: 3500 }); this.actionBusy.set(false); },
    });
  }

  getFraudSuggestion(c: PromotionFraudCase): { action: FraudAction; title: string; description: string; urgency: 'critical' | 'high' | 'medium' | 'low' } {
    const fp = c.promoter?.fraudProfile as any;
    const risk = c.riskLevel;
    const status = c.status;
    const strikeCount = fp?.strikeCount ?? 0;
    const warningCount = fp?.warningCount ?? 0;
    const activeCases = fp?.activeCaseCount ?? 0;
    const trustScore = fp?.trustScore ?? 100;
    const clickRatio = c.evidence?.invalidObservedClicks && c.evidence?.totalObservedClicks
      ? (c.evidence.invalidObservedClicks / c.evidence.totalObservedClicks) : 0;

    if (status === 'suspended' || status === 'resolved' || status === 'dismissed') {
      return { action: 'mark_resolved', title: 'Case already handled', description: 'This case has already been resolved. No further action is needed at this time.', urgency: 'low' };
    }

    if (risk === 'critical' || strikeCount >= 3) {
      return { action: 'suspend_promotion_indefinitely', title: 'Permanently suspend link', description: `Critical risk detected. ${strikeCount} strikes and ${warningCount} warnings. Immediate permanent suspension advised to protect platform integrity.`, urgency: 'critical' };
    }

    if (risk === 'high' && activeCases >= 2) {
      return { action: 'suspend_promotion_indefinitely', title: 'Suspend link + escalate', description: `High-risk repeat offender with ${activeCases} active cases. Recommend suspension and review of all associated links.`, urgency: 'high' };
    }

    if (risk === 'high' && trustScore < 50) {
      return { action: 'suspend_2_hours', title: 'Suspend promoter 2 hours', description: `Trust score dangerously low (${trustScore}). Temporary suspension sends a strong signal while preserving the link for review.`, urgency: 'high' };
    }

    if (risk === 'high') {
      return { action: 'suspend_2_hours', title: 'Suspend promoter temporarily', description: `High-risk detection with ${warningCount} prior warnings. A 2-hour suspension will pause the link and notify the promoter automatically.`, urgency: 'high' };
    }

    if (clickRatio > 0.5) {
      return { action: 'suspend_2_hours', title: 'Suspicious click pattern', description: `Over ${Math.round(clickRatio * 100)}% of observed clicks are invalid. Short suspension recommended while investigating the traffic source.`, urgency: 'medium' };
    }

    if (risk === 'medium' && status === 'final_warning_sent') {
      return { action: 'suspend_2_hours', title: 'Escalate after final warning', description: 'Final warning already sent. Escalate to a 2-hour suspension to demonstrate consequences for continued suspicious activity.', urgency: 'medium' };
    }

    if (risk === 'medium') {
      return { action: 'suspend_2_hours', title: 'Send warning + monitor', description: `Medium risk with ${warningCount} prior warnings. Consider suspending the promoter for 2 hours to deter further suspicious behavior.`, urgency: 'medium' };
    }

    return { action: 'suspend_2_hours', title: 'Review and monitor', description: 'Low-risk case. Review the evidence and either dismiss if false-positive, or send a warning to document the concern.', urgency: 'low' };
  }

  getPromoterName(c: PromotionFraudCase): string { return c.promoter?.displayName || c.promoter?.username || 'Promoter'; }
  getReasonSummary(c: PromotionFraudCase): string { return c.promotion?.fraudStatus?.reasonSummary || c.reasons?.map(r => r.label).slice(0, 3).join(', ') || 'Suspicious traffic pattern detected.'; }
  getStatusLabel(status: string): string { return status.replace(/_/g, ' '); }
  getStatusBadgeClass(status: string): string {
    if (['open'].includes(status)) return 'status-open';
    if (['warning_sent'].includes(status)) return 'status-warning';
    if (['final_warning_sent'].includes(status)) return 'status-final';
    if (['suspended'].includes(status)) return 'status-suspended';
    if (['resolved'].includes(status)) return 'status-resolved';
    if (['dismissed'].includes(status)) return 'status-dismissed';
    return 'status-default';
  }
  getActionTitle(a: FraudAction | null): string {
    switch (a) {
      case 'suspend_2_hours': return 'Suspend promoter for 2 hours';
      case 'suspend_promotion_indefinitely': return 'Suspend promotion link indefinitely';
      case 'reactivate_promotion': return 'Restore promotion link';
      case 'mark_resolved': return 'Mark case resolved';
      case 'dismiss': return 'Dismiss fraud case';
      default: return 'Update fraud case';
    }
  }
  getActionButtonLabel(a: FraudAction | null): string {
    switch (a) {
      case 'suspend_2_hours': return 'Suspend promoter';
      case 'suspend_promotion_indefinitely': return 'Suspend link';
      case 'reactivate_promotion': return 'Restore link';
      case 'mark_resolved': return 'Resolve case';
      case 'dismiss': return 'Dismiss case';
      default: return 'Confirm';
    }
  }
  getCaseTone(c: PromotionFraudCase): string { if (c.riskLevel === 'critical') return 'critical'; if (c.riskLevel === 'high') return 'high'; if (c.riskLevel === 'medium') return 'medium'; return 'low'; }

  private loadSummary(): void {
    this.isLoadingSummary.set(true);
    this.promotionService.getFraudSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: r => { this.summary.set(r.data || null); this.isLoadingSummary.set(false); }, error: () => { this.summary.set(null); this.isLoadingSummary.set(false); } });
  }
  private loadCases(): void {
    this.isLoadingCases.set(true);
    const f = this.filtersForm.getRawValue(); const p = this.pagination();
    this.promotionService.getFraudCases({ status: f.status || 'all', riskLevel: f.riskLevel || 'all', search: f.search?.trim() || '', page: p.page, limit: p.limit })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: r => { this.cases.set(r.data?.cases || []); this.pagination.update(c => ({ ...c, ...(r.data?.pagination || c) })); this.isLoadingCases.set(false); },
        error: () => { this.cases.set([]); this.isLoadingCases.set(false); },
      });
  }
}
