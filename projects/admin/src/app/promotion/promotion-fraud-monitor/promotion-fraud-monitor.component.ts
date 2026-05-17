import { Component, DestroyRef, TemplateRef, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  PromotionFraudCase,
  PromotionFraudSummary,
  PromotionService,
} from '../promotion.service';

type FraudAction = 'suspend_30_days' | 'reactivate_promotion' | 'mark_resolved' | 'dismiss';

@Component({
  selector: 'admin-promotion-fraud-monitor',
  standalone: true,
  providers: [PromotionService, DatePipe],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
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
  readonly pagination = signal({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  private actionDialogRef: MatDialogRef<unknown> | null = null;

  readonly filtersForm = this.fb.group({
    status: ['all'],
    riskLevel: ['all'],
    search: [''],
  });

  readonly summaryCards = computed(() => {
    const summary = this.summary();
    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Open cases',
        value: summary.openCases,
        icon: 'shield',
        tone: 'warning',
      },
      {
        label: 'Blocked promotions',
        value: summary.blockedPromotions,
        icon: 'link_off',
        tone: 'critical',
      },
      {
        label: 'Suspended promoters',
        value: summary.suspendedPromoters,
        icon: 'person_off',
        tone: 'critical',
      },
      {
        label: 'Critical cases',
        value: summary.criticalCases,
        icon: 'gpp_bad',
        tone: 'critical',
      },
    ];
  });

  constructor() {
    this.loadSummary();
    this.loadCases();

    this.filtersForm.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(250),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      )
      .subscribe(() => {
        this.pagination.update((current) => ({ ...current, page: 1 }));
        this.loadCases();
      });
  }

  refresh(): void {
    this.loadSummary();
    this.loadCases();
  }

  previousPage(): void {
    if (this.pagination().page <= 1 || this.isLoadingCases()) {
      return;
    }

    this.pagination.update((current) => ({ ...current, page: current.page - 1 }));
    this.loadCases();
  }

  nextPage(): void {
    if (this.pagination().page >= this.pagination().totalPages || this.isLoadingCases()) {
      return;
    }

    this.pagination.update((current) => ({ ...current, page: current.page + 1 }));
    this.loadCases();
  }

  openAction(caseItem: PromotionFraudCase, action: FraudAction): void {
    this.selectedCase.set(caseItem);
    this.selectedAction.set(action);
    this.actionReason.set('');
    this.actionDialogRef = this.dialog.open(this.actionDialog, {
      width: '480px',
      maxWidth: '92vw',
      panelClass: 'fraud-action-dialog',
    });
  }

  closeActionDialog(): void {
    this.actionDialogRef?.close();
    this.actionDialogRef = null;
    this.selectedCase.set(null);
    this.selectedAction.set(null);
    this.actionReason.set('');
  }

  confirmAction(): void {
    const selectedCase = this.selectedCase();
    const selectedAction = this.selectedAction();

    if (!selectedCase || !selectedAction) {
      return;
    }

    this.actionBusy.set(true);
    this.promotionService.applyFraudCaseAction(selectedCase._id, selectedAction, this.actionReason())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Fraud case updated successfully.', 'OK', { duration: 3000 });
          this.actionBusy.set(false);
          this.closeActionDialog();
          this.loadSummary();
          this.loadCases();
        },
        error: (error) => {
          console.error('Failed to update fraud case:', error);
          this.snackBar.open('Unable to update the fraud case right now.', 'OK', { duration: 3500 });
          this.actionBusy.set(false);
        },
      });
  }

  getPromoterName(caseItem: PromotionFraudCase): string {
    return caseItem.promoter?.displayName || caseItem.promoter?.username || 'Promoter';
  }

  getReasonSummary(caseItem: PromotionFraudCase): string {
    return caseItem.promotion?.fraudStatus?.reasonSummary
      || caseItem.reasons?.map((reason) => reason.label).slice(0, 3).join(', ')
      || 'Suspicious traffic pattern detected.';
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getActionTitle(action: FraudAction | null): string {
    switch (action) {
      case 'suspend_30_days':
        return 'Suspend promoter for 30 days';
      case 'reactivate_promotion':
        return 'Restore promotion link';
      case 'mark_resolved':
        return 'Mark case resolved';
      case 'dismiss':
        return 'Dismiss fraud case';
      default:
        return 'Update fraud case';
    }
  }

  getActionButtonLabel(action: FraudAction | null): string {
    switch (action) {
      case 'suspend_30_days':
        return 'Suspend promoter';
      case 'reactivate_promotion':
        return 'Restore link';
      case 'mark_resolved':
        return 'Resolve case';
      case 'dismiss':
        return 'Dismiss case';
      default:
        return 'Confirm';
    }
  }

  getCaseTone(caseItem: PromotionFraudCase): string {
    if (caseItem.riskLevel === 'critical') return 'critical';
    if (caseItem.riskLevel === 'high') return 'high';
    if (caseItem.riskLevel === 'medium') return 'medium';
    return 'low';
  }

  private loadSummary(): void {
    this.isLoadingSummary.set(true);
    this.promotionService.getFraudSummary()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.summary.set(response.data || null);
          this.isLoadingSummary.set(false);
        },
        error: (error) => {
          console.error('Failed to load fraud summary:', error);
          this.summary.set(null);
          this.isLoadingSummary.set(false);
        },
      });
  }

  private loadCases(): void {
    this.isLoadingCases.set(true);
    const filters = this.filtersForm.getRawValue();
    const pagination = this.pagination();

    this.promotionService.getFraudCases({
      status: filters.status || 'all',
      riskLevel: filters.riskLevel || 'all',
      search: filters.search?.trim() || '',
      page: pagination.page,
      limit: pagination.limit,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.cases.set(response.data?.cases || []);
          this.pagination.update((current) => ({
            ...current,
            ...(response.data?.pagination || current),
          }));
          this.isLoadingCases.set(false);
        },
        error: (error) => {
          console.error('Failed to load fraud cases:', error);
          this.cases.set([]);
          this.isLoadingCases.set(false);
        },
      });
  }
}
