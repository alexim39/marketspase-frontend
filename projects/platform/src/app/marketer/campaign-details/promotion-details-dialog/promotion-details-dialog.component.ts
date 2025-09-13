import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { PromotionInterface } from '../../../../../../shared-services/src/public-api';
import { MarketerService } from '../../marketer.service';
import { MaskEmailPipe } from './mask-email.pipe';
import { MediaViewerDialogComponent } from './media-viewer-dialog.component'; 

@Component({
  selector: 'app-promotion-details-dialog',
  standalone: true,
  providers: [MarketerService],
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, DatePipe, MaskEmailPipe],
  template: `
  <div class="promotion-details-dialog">
    <h2 mat-dialog-title>Promotion Details</h2>
    <mat-dialog-content>
      <div class="dialog-section">
        <div class="promoter-info-large">
          <div class="avatar-large">{{getInitials(data.promotion.promoter.displayName)}}</div>
          <div class="promoter-details-large">
            <span class="promoter-name">{{data.promotion.promoter.displayName || 'Unknown'}}</span>
            <span class="promoter-contact" *ngIf="data.promotion.promoter.email">
              <mat-icon>email</mat-icon>
              {{data.promotion.promoter.email | maskEmail}}
            </span>
            <span class="promoter-rating" *ngIf="data.promotion.promoter?.rating">
              <mat-icon>star</mat-icon>
              Rating: {{data.promotion.promoter.rating | number:'1.1-1'}}
            </span>
          </div>
        </div>
      </div>
      
      <div class="dialog-section">
        <h3>Promotion Status</h3>
        <div class="status-timeline">
          <div class="status-step" [class.active]="true">
            <div class="step-icon">
              <mat-icon>assignment</mat-icon>
            </div>
            <div class="step-content">
              <span class="step-title">Assigned</span>
              <br>
              <span class="step-time">{{data.promotion.createdAt | date:'medium'}}</span>
            </div>
          </div>
          
          <div class="status-step" [class.active]="data.promotion.status !== 'pending'">
            <div class="step-icon">
              <mat-icon>file_upload</mat-icon>
            </div>
            <div class="step-content">
              <span class="step-title">Submitted</span>
              <br>
              <span class="step-time" *ngIf="data.promotion.submittedAt">
                {{data.promotion.submittedAt | date:'medium'}}
              </span>
            </div>
          </div>
          
          <div class="status-step" [class.active]="['validated', 'paid'].includes(data.promotion.status)">
            <div class="step-icon">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="step-content">
              <span class="step-title">Validated</span>
              <br>
              <span class="step-time" *ngIf="data.promotion.validatedAt">
                {{data.promotion.validatedAt | date:'medium'}}
              </span>
            </div>
          </div>
          
          <div class="status-step" [class.active]="data.promotion.status === 'paid'">
            <div class="step-icon">
              <mat-icon>payments</mat-icon>
            </div>
            <div class="step-content">
              <span class="step-title">Paid</span>
              <br>
              <span class="step-time" *ngIf="data.promotion.paidAt">
                {{data.promotion.paidAt | date:'medium'}}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dialog-section" *ngIf="data.promotion.proofMedia && data.promotion.proofMedia.length > 0">
        <h3>Proof Media</h3>
        <div class="proof-media-grid">
          <div class="proof-media-item" *ngFor="let media of data.promotion.proofMedia; let i = index">
            <img [src]="api + media" [alt]="'Proof ' + (i + 1)" (click)="openMediaDialog(media)" class="proof-image">
          </div>
        </div>
      </div>
      
      <div class="dialog-section" *ngIf="data.promotion.rejectionReason">
        <h3>Rejection Reason</h3>
        <p class="rejection-reason">{{data.promotion.rejectionReason}}</p>
      </div>
      
      <div class="dialog-section" *ngIf="data.promotion.notes">
        <h3>Notes</h3>
        <p class="promotion-notes">{{data.promotion.notes}}</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
      <button mat-flat-button color="primary" (click)="validatePromotion()" *ngIf="data.promotion.status === 'submitted'">
        Validate
      </button>
      <button mat-flat-button color="warn" (click)="rejectPromotion()" *ngIf="data.promotion.status === 'submitted'">
        Reject
      </button>
    </mat-dialog-actions>
  </div>
  `,
  styleUrls: ['./promotion-details-dialog.component.scss']
})
export class PromotionDetailsDialogComponent {
  private marketerService = inject(MarketerService);
  private dialog = inject(MatDialog); // Inject MatDialog service
  public readonly api = this.marketerService.api;

  constructor(
    public dialogRef: MatDialogRef<PromotionDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { promotion: PromotionInterface }
  ) {}
  
  getInitials(name: string | undefined): string {
    //console.log('promotion ', this.data.promotion)
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  }

  validatePromotion() {
    this.dialogRef.close('validated');
  }

  rejectPromotion() {
    this.dialogRef.close('rejected');
  }

  openMediaDialog(mediaUrl: string) {
    const fullMediaUrl = this.api + mediaUrl;
    
    this.dialog.open(MediaViewerDialogComponent, {
      data: { mediaUrl: fullMediaUrl },
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'media-viewer-dialog-container'
    });
  }
}