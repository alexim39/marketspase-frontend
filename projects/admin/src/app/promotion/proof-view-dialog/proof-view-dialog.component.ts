import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'proof-view-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="proof-dialog">
      <div mat-dialog-title>
        <h2>Proof Submission</h2>
        <button mat-icon-button (click)="onClose()" class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div mat-dialog-content>
        <div class="promotion-info">
          <p><strong>Promoter:</strong> {{ data.campaign.owner.displayName }} (@{{ data.campaign.owner.username }})</p>
          <p><strong>Views:</strong> {{ data.promotion.proofViews || 0 }}</p>
          <p><strong>Submitted:</strong> {{ data.promotion.submittedAt | date:'medium' }}</p>
          <p><strong>Status:</strong> {{ data.promotion.status | titlecase }}</p>
        </div>
        
        @if (data.promotion.proofMedia && data.promotion.proofMedia.length > 0) {
            <div class="proof-images">
            <h3>Proof Images</h3>
            <div class="image-grid">
                @for (imageUrl of data.promotion.proofMedia; track imageUrl; let i = $index) {
                    <div class="image-item">
                        <img [src]="imageUrl" [alt]="'Proof image ' + (i + 1)" class="proof-image">
                        <div class="image-number">Image {{ i + 1 }}</div>
                    </div>
                }
            </div>
            </div>
        }
        
        @if (!data.promotion.proofMedia || data.promotion.proofMedia.length === 0) {
            <div class="no-proof">
                <mat-icon>image_not_supported</mat-icon>
                <p>No proof images available</p>
            </div>
        }
        
      </div>
      
      <div mat-dialog-actions align="end">
        <button mat-button (click)="onClose()">Close</button>
      </div>
    </div>
  `,
  styleUrls: ['./proof-view-dialog.component.scss']
})
export class ProofViewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProofViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { promotion: any; campaign: any }
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
}