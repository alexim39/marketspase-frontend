import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PromotionInterface } from '../../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-promotion-proof',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="proof-section" *ngIf="promotion.proofMedia && promotion.proofMedia.length > 0">
      <div class="section-header">
        <h3 class="section-title">Proof of Promotion</h3>
      </div>
      
      <div class="proof-grid">
        <div class="proof-item" *ngFor="let media of promotion.proofMedia" (click)="viewProof.emit(media)">
          <img [src]="apiUrl + media" alt="Proof media" class="proof-image">
          <div class="proof-actions">
            <button class="proof-action-btn">
              <mat-icon>visibility</mat-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./promotion-proof.component.scss']
})
export class PromotionProofComponent {
  @Input() promotion!: PromotionInterface;
  @Input() apiUrl!: string;
  @Output() viewProof = new EventEmitter<string>();
}