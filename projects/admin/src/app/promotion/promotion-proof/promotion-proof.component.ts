// promotion-proof.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { PromotionInterface } from '../../../../../shared-services/src/public-api';
import { CampaignService } from '../../campaign/campaign.service';

@Component({
  selector: 'admin-promotion-proof',
  standalone: true,
  providers: [CampaignService],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule
  ],
  templateUrl: './promotion-proof.component.html',
  styleUrls: ['./promotion-proof.component.scss']
})
export class PromotionProofComponent implements OnInit {
  readonly dialogRef = inject(MatDialogRef<PromotionProofComponent>);
  readonly data = inject<{ promotion: PromotionInterface }>(MAT_DIALOG_DATA);
  readonly campaignService = inject(CampaignService);

  isLoading = signal(true);
  promotion = signal<PromotionInterface | null>(null);
  activeImageIndex = signal(0);
  public readonly api = this.campaignService.api;

  ngOnInit(): void {
    this.promotion.set(this.data.promotion);
    this.isLoading.set(false);
    console.log('promotion ',this.data.promotion)
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  nextImage(): void {
    if (this.promotion()?.proofMedia && this.promotion()!.proofMedia.length > 0) {
      const nextIndex = (this.activeImageIndex() + 1) % this.promotion()!.proofMedia.length;
      this.activeImageIndex.set(nextIndex);
    }
  }

  prevImage(): void {
    if (this.promotion()?.proofMedia && this.promotion()!.proofMedia.length > 0) {
      const prevIndex = (this.activeImageIndex() - 1 + this.promotion()!.proofMedia.length) % 
                        this.promotion()!.proofMedia.length;
      this.activeImageIndex.set(prevIndex);
    }
  }

  setActiveImage(index: number): void {
    this.activeImageIndex.set(index);
  }
}