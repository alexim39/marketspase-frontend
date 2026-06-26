import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-save-template-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatDialogModule,
  ],
  template: `
    <div class="save-dialog">
      <header class="dialog-header">
        <div class="header-icon">
          <mat-icon>bookmark_add</mat-icon>
        </div>
        <div>
          <h2 mat-dialog-title>Save as Template</h2>
          <p>Reuse this campaign setup for future campaigns with one click.</p>
        </div>
      </header>

      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Template name</mat-label>
          <mat-icon matPrefix>label</mat-icon>
          <input matInput [(ngModel)]="templateName" maxlength="80" placeholder="e.g. Summer Sale Campaign" autofocus />
          <mat-hint align="end">{{ templateName.length }}/80</mat-hint>
        </mat-form-field>

        <div class="saved-preview">
          <span class="preview-label">What gets saved</span>
          <div class="preview-items">
            <div class="preview-item">
              <mat-icon>check_circle</mat-icon>
              <div>
                <strong>Campaign content</strong>
                <span>Title, caption, category, and link</span>
              </div>
            </div>
            <div class="preview-item">
              <mat-icon>check_circle</mat-icon>
              <div>
                <strong>Goal &amp; budget</strong>
                <span>Promotion goal, budget amount, and target audience</span>
              </div>
            </div>
            <div class="preview-item">
              <mat-icon>check_circle</mat-icon>
              <div>
                <strong>Pricing</strong>
                <span>Cost-per-click setting</span>
              </div>
            </div>
            <div class="preview-item excluded">
              <mat-icon>cancel</mat-icon>
              <div>
                <strong>Media files</strong>
                <span>Not saved — re-upload when using template</span>
              </div>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" [disabled]="!templateName.trim()" (click)="save()">
          <mat-icon>bookmark_add</mat-icon>
          Save Template
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styleUrls: ['./save-template-dialog.component.scss'],
})
export class SaveTemplateDialogComponent {
  private dialogRef = inject(MatDialogRef<SaveTemplateDialogComponent>);
  templateName = '';

  save(): void {
    const name = this.templateName.trim();
    if (!name) return;
    this.dialogRef.close(name);
  }
}
