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
  styles: [`
    .proof-dialog {
      max-width: 100%;
    }
    
    .proof-dialog .mat-dialog-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 0;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .proof-dialog h2 {
      margin: 0;
      font-size: 20px;
    }
    
    .close-button {
      margin-right: -8px;
    }
    
    .proof-dialog .mat-dialog-content {
      max-height: 70vh;
      padding: 24px;
      margin: 0;
    }
    
    .promotion-info {
      margin-bottom: 24px;
    }
    
    .promotion-info p {
      margin: 8px 0;
    }
    
    .proof-images h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 500;
    }
    
    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .image-item {
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .proof-image {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }
    
    .image-number {
      padding: 8px;
      text-align: center;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .no-proof {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 0;
      color: rgba(0, 0, 0, 0.54);
    }
    
    .no-proof mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }
    
    .proof-dialog .mat-dialog-actions {
      padding: 8px 24px 24px 24px;
      margin: 0;
    }
  `]
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