import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '@shared/services';

@Component({
  selector: 'app-template-picker-dialog',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="picker-dialog">
      <header class="dialog-header">
        <div class="header-icon">
          <mat-icon>description</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>Choose a Template</h2>
          <p>Start from a saved setup to save time on repetitive campaigns.</p>
        </div>
      </header>

      <mat-dialog-content>
        @if (loading()) {
          <div class="feedback-state">
            <mat-spinner diameter="28" />
            <span>Loading your templates&hellip;</span>
          </div>
        } @else if (error()) {
          <div class="feedback-state error">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error() }}</p>
            <button mat-stroked-button (click)="fetchTemplates()">Try Again</button>
          </div>
        } @else if (templates().length === 0) {
          <div class="feedback-state empty">
            <mat-icon>auto_awesome</mat-icon>
            <strong>No templates yet</strong>
            <p>Save a campaign setup as a template while creating or editing a campaign.</p>
          </div>
        } @else {
          <div class="template-list">
            @for (t of templates(); track t._id) {
              <article
                class="template-row"
                (click)="select(t)"
                (keydown.enter)="select(t)"
                tabindex="0"
                role="button"
                [attr.aria-label]="'Load template ' + t.name"
              >
                <div class="row-icon">
                  <mat-icon>description</mat-icon>
                </div>
                <div class="row-body">
                  <span class="row-name">{{ t.name }}</span>
                  <span class="row-meta">
                    {{ t.data?.title || 'Untitled' }}
                    @if (t.useCount) {
                      &middot; <span class="use-badge">{{ t.useCount }}&times;</span>
                    }
                    &middot; {{ t.updatedAt | date:'MMM d, y' }}
                  </span>
                </div>
                <button
                  mat-icon-button
                  class="row-delete"
                  (click)="deleteTemplate(t, $event)"
                  (keydown.enter)="deleteTemplate(t, $event)"
                  matTooltip="Delete template"
                  aria-label="Delete template"
                >
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </article>
            }
          </div>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button mat-dialog-close>Cancel</button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./template-picker-dialog.component.scss'],
})
export class TemplatePickerDialogComponent implements OnInit {
  private api = inject(ApiService);
  private dialogRef = inject(MatDialogRef<TemplatePickerDialogComponent>);
  private snackBar = inject(MatSnackBar);

  readonly templates = signal<any[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.fetchTemplates();
  }

  fetchTemplates(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<any>('api/v1/campaign/templates', undefined, undefined, true).subscribe({
      next: (r) => { this.templates.set(r?.data || []); this.loading.set(false); },
      error: (e) => { this.error.set(e?.message || 'Failed to load templates'); this.loading.set(false); },
    });
  }

  select(template: any): void {
    this.dialogRef.close(template);
  }

  deleteTemplate(template: any, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.snackBar.open(`Delete "${template.name}"?`, 'Yes, delete', { duration: 4000 })
      .onAction().subscribe(() => {
        this.api.delete<any>(`api/v1/campaign/templates/${template._id}`, undefined, undefined, true).subscribe({
          next: () => {
            this.templates.set(this.templates().filter(t => t._id !== template._id));
            this.snackBar.open(`Deleted "${template.name}"`, 'OK', { duration: 2000 });
          },
          error: () => this.snackBar.open('Failed to delete template', 'Close', { duration: 2000 }),
        });
      });
  }
}
