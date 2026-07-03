import { Component, inject, signal, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@shared/services/api';

export interface SmartInviteDialogData {
  campaignId: string;
  campaignTitle: string;
}

@Component({
  selector: 'app-smart-invite-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="smart-invite-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>auto_awesome</mat-icon>
          AI Promoter Matches
        </h2>
        <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
      </div>

      <p class="subtitle">Top performers in "{{ data.campaignTitle }}" category, ranked by engagement and trust</p>

      <mat-dialog-content>
        @if (loading()) {
          <div class="loading-state">
            <mat-spinner diameter="32"></mat-spinner>
            <span>Finding the best promoters...</span>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <mat-icon>error_outline</mat-icon>
            <span>{{ error() }}</span>
            <button mat-stroked-button (click)="loadSuggestions()">Retry</button>
          </div>
        } @else if (suggestions().length === 0) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <strong>No promoter matches yet</strong>
            <span>Check back once your campaign starts getting clicks. Our AI will find the best promoters for you.</span>
          </div>
        } @else {
          <div class="select-all-row">
            <label>
              <mat-checkbox [checked]="allSelected()" (change)="toggleAll($event.checked)">Select all {{ suggestions().length }}</mat-checkbox>
            </label>
            <span class="selected-count">{{ selectedCount() }} selected</span>
          </div>

          <div class="suggestions-list">
            @for (p of suggestions(); track p.promoterId) {
              <div class="promoter-row" [class.selected]="isSelected(p.promoterId)">
                <mat-checkbox [checked]="isSelected(p.promoterId)" (change)="togglePromoter(p.promoterId, $event.checked)" (click)="$event.stopPropagation()"></mat-checkbox>

                <div class="promoter-avatar">
                  @if (p.avatar) {
                    <img [src]="p.avatar" [alt]="p.promoterName">
                  } @else {
                    <span>{{ (p.promoterName || '?').charAt(0) }}</span>
                  }
                </div>

                <div class="promoter-info">
                  <strong>{{ p.promoterName }}</strong>
                  <span class="reason">{{ p.reason }}</span>
                </div>

                <div class="promoter-stats">
                  <span class="tier-badge" [class]="p.tier">{{ tierLabel(p.tier) }}</span>
                  <span class="score">{{ p.score }}/100</span>
                </div>
              </div>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close [disabled]="inviting()">Cancel</button>
        <button mat-flat-button color="primary" (click)="inviteSelected()" [disabled]="inviting() || selectedCount() === 0">
          @if (inviting()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <mat-icon>send</mat-icon>
          }
          Invite {{ selectedCount() }} promoter{{ selectedCount() !== 1 ? 's' : '' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./smart-invite-dialog.component.scss'],
})
export class SmartInviteDialogComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<SmartInviteDialogComponent>);

  loading = signal(true);
  error = signal('');
  inviting = signal(false);
  suggestions = signal<any[]>([]);
  selectedIds = signal<Set<string>>(new Set());

  constructor(@Inject(MAT_DIALOG_DATA) public data: SmartInviteDialogData) {}

  ngOnInit(): void { this.loadSuggestions(); }

  loadSuggestions(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get<any>(`api/v1/campaign/${this.data.campaignId}/smart-invite`, undefined, undefined, true)
      .subscribe({
        next: (resp) => {
          this.suggestions.set(resp?.data || []);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load suggestions.');
          this.loading.set(false);
        },
      });
  }

  isSelected(id: string): boolean { return this.selectedIds().has(id); }
  selectedCount(): number { return this.selectedIds().size; }
  allSelected(): boolean { return this.suggestions().length > 0 && this.selectedCount() === this.suggestions().length; }

  toggleAll(checked: boolean): void {
    this.selectedIds.set(checked ? new Set(this.suggestions().map(p => p.promoterId)) : new Set());
  }

  togglePromoter(id: string, checked: boolean): void {
    const set = new Set(this.selectedIds());
    checked ? set.add(id) : set.delete(id);
    this.selectedIds.set(set);
  }

  tierLabel(tier: string): string {
    return tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'New';
  }

  inviteSelected(): void {
    if (this.selectedCount() === 0) return;
    this.inviting.set(true);
    this.api.post<any>(`api/v1/campaign/${this.data.campaignId}/smart-invite`, { promoterIds: [...this.selectedIds()] }, undefined, true)
      .subscribe({
        next: () => {
          this.snack.open(`Invited ${this.selectedCount()} promoter(s)!`, 'OK', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.snack.open(err?.error?.message || 'Invite failed.', 'OK', { duration: 4000 });
          this.inviting.set(false);
        },
      });
  }
}
