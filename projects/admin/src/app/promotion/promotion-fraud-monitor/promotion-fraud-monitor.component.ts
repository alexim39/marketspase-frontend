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
import { MatTooltipModule } from '@angular/material/tooltip';
import { PromotionFraudCase, PromotionFraudSummary, PromotionService } from '../promotion.service';

type FraudAction = 'suspend_2_hours' | 'suspend_promotion_indefinitely' | 'reactivate_promotion' | 'mark_resolved' | 'dismiss';

@Component({
  selector: 'admin-promotion-fraud-monitor',
  standalone: true,
  providers: [PromotionService, DatePipe],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatIconModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatProgressBarModule, MatDialogModule, MatSnackBarModule, MatTooltipModule],
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
  readonly pagination = signal({ page: 1, limit: 20, total: 0, totalPages: 0 });
  readonly pageSizeOptions = [12, 20, 50, 100];
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

  readonly criticalCount = computed(() => this.cases().filter(c => c.riskLevel === 'critical').length);
  readonly highCount = computed(() => this.cases().filter(c => c.riskLevel === 'high').length);

  readonly pageNumbers = computed(() => {
    const t = Math.max(1, this.pagination().totalPages);
    const c = this.pagination().page;
    const pages: number[] = []; const s = Math.max(1, c - 2); const e = Math.min(t, c + 2);
    for (let i = s; i <= e; i++) pages.push(i);
    return pages;
  });

  constructor() {
    this.loadSummary(); this.loadCases();
    this.filtersForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef), debounceTime(250), distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)))
      .subscribe(() => { this.pagination.update(c => ({ ...c, page: 1 })); this.loadCases(); });
  }

  refresh(): void { this.loadSummary(); this.loadCases(); }

  goToPage(page: number): void {
    const t = Math.max(1, Math.min(page, this.pagination().totalPages));
    if (t === this.pagination().page || this.isLoadingCases()) return;
    this.pagination.update(c => ({ ...c, page: t })); this.loadCases();
  }
  onPageInput(e: Event): void { const i = e.target as HTMLInputElement; const p = parseInt(i.value, 10); if (!isNaN(p) && p >= 1 && p <= this.pagination().totalPages) this.goToPage(p); i.value = ''; }
  onPageSizeChange(size: string | number): void { const n = typeof size === 'string' ? parseInt(size, 10) : size; this.pagination.set({ page: 1, limit: n, total: this.pagination().total, totalPages: Math.ceil(this.pagination().total / n) }); this.loadCases(); }

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

  getPromoterName(c: PromotionFraudCase): string { return c.promoter?.displayName || c.promoter?.username || 'Promoter'; }
  getReasonSummary(c: PromotionFraudCase): string { return c.promotion?.fraudStatus?.reasonSummary || c.reasons?.map(r => r.label).slice(0, 3).join(', ') || 'Suspicious traffic pattern detected.'; }
  getStatusLabel(status: string): string { return status.replace(/_/g, ' '); }
  getActionTitle(a: FraudAction | null): string {
    switch (a) { case 'suspend_2_hours': return 'Suspend promoter for 2 hours'; case 'suspend_promotion_indefinitely': return 'Suspend promotion link indefinitely'; case 'reactivate_promotion': return 'Restore promotion link'; case 'mark_resolved': return 'Mark case resolved'; case 'dismiss': return 'Dismiss fraud case'; default: return 'Update fraud case'; }
  }
  getActionButtonLabel(a: FraudAction | null): string {
    switch (a) { case 'suspend_2_hours': return 'Suspend promoter'; case 'suspend_promotion_indefinitely': return 'Suspend link'; case 'reactivate_promotion': return 'Restore link'; case 'mark_resolved': return 'Resolve case'; case 'dismiss': return 'Dismiss case'; default: return 'Confirm'; }
  }
  getCaseTone(c: PromotionFraudCase): string { if (c.riskLevel === 'critical') return 'critical'; if (c.riskLevel === 'high') return 'high'; if (c.riskLevel === 'medium') return 'medium'; return 'low'; }
  getStatusBadgeClass(status: string): string {
    if (status === 'open') return 'status-open'; if (status === 'warning_sent') return 'status-warning'; if (status === 'final_warning_sent') return 'status-final'; if (status === 'suspended') return 'status-suspended'; if (status === 'resolved') return 'status-resolved'; if (status === 'dismissed') return 'status-dismissed'; return 'status-default';
  }

  getFraudSuggestion(c: PromotionFraudCase): { action: FraudAction; title: string; description: string; urgency: 'critical' | 'high' | 'medium' | 'low' } {
    const fp = (c as any).promoter?.fraudProfile as any;
    const r = c.riskLevel; const s = c.status;
    const strikes = fp?.strikeCount ?? 0; const warnings = fp?.warningCount ?? 0;
    const activeCases = fp?.activeCaseCount ?? 0; const trust = fp?.trustScore ?? 100;
    const ratio = c.evidence?.invalidObservedClicks && c.evidence?.totalObservedClicks ? (c.evidence.invalidObservedClicks / c.evidence.totalObservedClicks) : 0;

    if (s === 'suspended' || s === 'resolved' || s === 'dismissed') return { action: 'mark_resolved', title: 'Already handled', description: 'No further action needed.', urgency: 'low' };
    if (r === 'critical' || strikes >= 3) return { action: 'suspend_promotion_indefinitely', title: 'Permanently suspend link', description: `Critical risk. ${strikes} strikes, ${warnings} warnings. Immediate suspension advised.`, urgency: 'critical' };
    if (r === 'high' && activeCases >= 2) return { action: 'suspend_promotion_indefinitely', title: 'Suspend link + escalate', description: `Repeat offender with ${activeCases} active cases.`, urgency: 'high' };
    if (r === 'high' && trust < 50) return { action: 'suspend_2_hours', title: 'Suspend promoter 2 hours', description: `Trust score dangerously low (${trust}).`, urgency: 'high' };
    if (r === 'high') return { action: 'suspend_2_hours', title: 'Suspend promoter temporarily', description: `High risk with ${warnings} prior warnings.`, urgency: 'high' };
    if (ratio > 0.5) return { action: 'suspend_2_hours', title: 'Suspicious click pattern', description: `Over ${Math.round(ratio * 100)}% clicks are invalid.`, urgency: 'medium' };
    if (r === 'medium' && s === 'final_warning_sent') return { action: 'suspend_2_hours', title: 'Escalate after final warning', description: 'Final warning sent. Escalate to suspension.', urgency: 'medium' };
    if (r === 'medium') return { action: 'suspend_2_hours', title: 'Send warning + monitor', description: `${warnings} prior warnings. Consider suspending.`, urgency: 'medium' };
    return { action: 'suspend_2_hours', title: 'Review and monitor', description: 'Low risk. Review evidence.', urgency: 'low' };
  }

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
