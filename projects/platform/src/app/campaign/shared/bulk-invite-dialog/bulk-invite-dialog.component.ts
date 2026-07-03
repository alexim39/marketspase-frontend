import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ApiService } from '@shared/services/api';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

interface PromoterResult {
  _id: string;
  displayName: string;
  avatar?: string;
  email?: string;
  promoterTier?: string;
}

@Component({
  selector: 'app-bulk-invite-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule,
    MatChipsModule, MatAutocompleteModule, MatInputModule, MatFormFieldModule,
  ],
  template: `
    <h2 mat-dialog-title class="dialog-heading">Bulk Invite Promoters</h2>
    <mat-dialog-content>
      @if (result()) {
        <div class="result-card">
          <mat-icon>check_circle</mat-icon>
          <strong>{{ result().invited }} of {{ result().total }} promoters invited</strong>
          <button mat-stroked-button (click)="reset()">Invite More</button>
        </div>
      } @else {
        <p class="desc">Search and select promoters by name to invite them to this campaign. Max 50 at a time.</p>

        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search promoters</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch($event)" placeholder="Type a name..." />
          @if (searching()) { <mat-spinner matSuffix diameter="18" /> }
          @if (searchQuery && !searching()) {
            <button matSuffix mat-icon-button (click)="clearSearch()" aria-label="Clear"><mat-icon>close</mat-icon></button>
          }
        </mat-form-field>

        @if (suggestions().length > 0) {
          <div class="suggestions-list">
            @for (p of suggestions(); track p._id) {
              <div class="suggestion-row" [class.selected]="isSelected(p._id)" (click)="addPromoter(p)" role="button" tabindex="0" (keydown.enter)="addPromoter(p)">
                <div class="sug-avatar">{{ p.displayName?.charAt(0) || '?' }}</div>
                <div class="sug-info">
                  <span class="sug-name">{{ p.displayName }}</span>
                  <span class="sug-meta">{{ p.email }}</span>
                </div>
                <mat-icon class="sug-action-icon" [class.check]="isSelected(p._id)" [class.add]="!isSelected(p._id)">
                  {{ isSelected(p._id) ? 'check_circle' : 'add_circle' }}
                </mat-icon>
              </div>
            }
          </div>
        } @else if (searchQuery.length >= 2 && !searching()) {
          <p class="no-results">No promoters found matching &ldquo;{{ searchQuery }}&rdquo;</p>
        }

        @if (selectedPromoters().length > 0) {
          <div class="selected-section">
            <span class="section-label">Selected ({{ selectedPromoters().length }})</span>
            <mat-chip-grid aria-label="Selected promoters">
              @for (p of selectedPromoters(); track p._id) {
                <mat-chip-row (removed)="removePromoter(p._id)">
                  {{ p.displayName }}
                  <button matChipRemove><mat-icon>cancel</mat-icon></button>
                </mat-chip-row>
              }
            </mat-chip-grid>
          </div>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      @if (!result()) {
        <button mat-flat-button color="primary" (click)="invite()" [disabled]="selectedPromoters().length === 0 || sending()">
          @if (sending()) {
            <mat-spinner diameter="18" />
          } @else {
            <mat-icon>send</mat-icon>
          }
          Send {{ selectedPromoters().length ? selectedPromoters().length + ' Invite' + (selectedPromoters().length > 1 ? 's' : '') : '' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styleUrls: ['./bulk-invite-dialog.component.scss'],
})
export class BulkInviteDialogComponent {
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<BulkInviteDialogComponent>);
  private snackBar = inject(MatSnackBar);

  readonly campaignId = signal('');
  searchQuery = '';
  readonly searching = signal(false);
  readonly selectedPromoters = signal<PromoterResult[]>([]);
  readonly suggestions = signal<PromoterResult[]>([]);
  readonly result = signal<any>(null);
  private search$ = new Subject<string>();

  constructor() {
    this.search$.pipe(debounceTime(250), distinctUntilChanged()).subscribe((q) => {
      if (q.trim().length < 2) { this.suggestions.set([]); return; }
      this.searching.set(true);
      this.api.get<any>(`api/v1/user/promoters/search?q=${encodeURIComponent(q.trim())}`, undefined, undefined, true)
        .subscribe({
          next: (r) => { this.suggestions.set(r?.data || []); this.searching.set(false); },
          error: () => { this.suggestions.set([]); this.searching.set(false); },
        });
    });
  }

  onSearch(query: string): void {
    this.search$.next(query);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.suggestions.set([]);
  }

  isSelected(id: string): boolean {
    return this.selectedPromoters().some(p => p._id === id);
  }

  addPromoter(promoter: PromoterResult): void {
    const current = this.selectedPromoters();
    if (current.length >= 50) { this.snackBar.open('Max 50 promoters', 'OK', { duration: 1500 }); return; }
    if (current.some(p => p._id === promoter._id)) return;
    this.selectedPromoters.set([...current, promoter]);
  }

  removePromoter(id: string): void {
    this.selectedPromoters.set(this.selectedPromoters().filter(p => p._id !== id));
  }

  invite(): void {
    const ids = this.selectedPromoters().map(p => p._id);
    if (!ids.length) return;

    this.sending.set(true);
    this.api.post<any>(`api/v1/user/campaign/${this.campaignId()}/bulk-invite`, { promoterIds: ids }, undefined, true)
      .subscribe({
        next: (r) => {
          this.result.set(r?.data || { invited: 0, total: ids.length });
          this.sending.set(false);
          if (r?.data?.invited > 0) {
            this.snackBar.open(`Sent ${r.data.invited} invites`, 'OK', { duration: 2500 });
          }
        },
        error: (e) => {
          this.sending.set(false);
          this.snackBar.open(e?.message || 'Failed to send invites', 'Close', { duration: 3000 });
        },
      });
  }

  readonly sending = signal(false);

  reset(): void {
    this.result.set(null);
    this.selectedPromoters.set([]);
    this.searchQuery = '';
    this.suggestions.set([]);
  }
}
