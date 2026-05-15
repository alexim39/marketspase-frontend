import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { PromotionInterface } from '@shared/services';
import { PromoterService } from '../../../promoter.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { WhatsAppInstructionsDialogComponent } from './instruction-dialog/instruction-dialog.component';

@Component({
  selector: 'app-promotion-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './promotion-card.component.html',
  styleUrls: ['./promotion-card.component.scss']
})
export class PromotionCardComponent {
  @Input({ required: true }) promotion!: PromotionInterface;

  public isSharing = signal<boolean>(false);
  public isDownloading = signal<boolean>(false);

  private promoterService = inject(PromoterService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  public readonly api = this.promoterService.api;

  getPromotionUrl(): string {
    if (this.promotion.promotionUrl) return this.promotion.promotionUrl;
    return `${this.api.replace(/\/$/, '')}/api/v1/campaign/track/${this.promotion.upi}`;
  }

  getAssetUrl(): string {
    return this.normalizeAssetUrl(this.promotion.campaign?.mediaUrl);
  }

  getThumbnailUrl(): string {
    return this.normalizeAssetUrl(this.promotion.campaign?.thumbnailUrl || this.promotion.campaign?.mediaUrl);
  }

  getTotalClicks(): number {
    return this.promotion.clickStats?.totalClicks || 0;
  }

  getBillableClicks(): number {
    return this.promotion.clickStats?.billableClicks || 0;
  }

  getEarnedAmount(): number {
    return this.promotion.clickStats?.earnedAmount ?? this.promotion.payoutAmount ?? 0;
  }

  getCostPerClick(): number {
    return this.promotion.costPerClick || this.promotion.campaign.costPerClick || 80;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      accepted: 'Active Link',
      downloaded: 'Active Link',
      submitted: 'Review Pending',
      validated: 'Approved',
      paid: 'Paid',
      rejected: 'Needs Attention'
    };
    return labels[status] || 'Promotion';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      accepted: 'success',
      downloaded: 'success',
      submitted: 'info',
      validated: 'success',
      paid: 'primary',
      rejected: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      accepted: 'link',
      downloaded: 'link',
      submitted: 'pending_actions',
      validated: 'check_circle',
      paid: 'paid',
      rejected: 'warning'
    };
    return icons[status] || 'help';
  }

  getCategoryIcon(category: string): string {
    const categoryIcons: {[key: string]: string} = {
      fashion: 'category',
      food: 'restaurant',
      tech: 'smartphone',
      entertainment: 'music_note',
      health: 'fitness_center',
      beauty: 'face',
      travel: 'flight',
      business: 'business',
      other: 'category'
    };
    
    return categoryIcons[category] || 'category';
  }

  viewDetails(): void {
    if (this.promotion) {
      this.router.navigate(['/dashboard/campaigns/promotions', this.promotion._id]);
    }
  }

  openPromotionLink(): void {
    window.open(this.getPromotionUrl(), '_blank', 'noopener');
  }

  async downloadAdAsset(): Promise<void> {
    const assetUrl = this.getAssetUrl();
    if (!assetUrl) {
      this.snackBar.open('Campaign media is not available for download.', 'OK', { duration: 3000 });
      return;
    }

    try {
      this.isDownloading.set(true);
      const response = await fetch(assetUrl);
      if (!response.ok) throw new Error(`Failed to download asset: ${response.status}`);

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = this.getAssetFileName(assetUrl);
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);

      this.snackBar.open('Ad asset download started', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('Failed to download campaign media:', err);
      window.open(assetUrl, '_blank', 'noopener');
      this.snackBar.open('Unable to download directly. Asset opened in a new tab.', 'OK', { duration: 4000 });
    } finally {
      this.isDownloading.set(false);
    }
  }

  copyPromotionLink(): void {
    this.copyText(this.getPromotionUrl(), 'Promotion link copied');
  }

  copyCaption(caption?: string): void {
    this.copyText(this.buildShareText(caption), 'Caption and tracked link copied');
  }

  showWhatsAppSharingInstructions(promotion: PromotionInterface): void {
    const captionText = this.buildShareText(promotion.campaign?.caption);

    this.dialog.open(WhatsAppInstructionsDialogComponent, {
      data: {
        captionText,
        promotionTitle: promotion.campaign?.title,
        promotionUrl: this.getPromotionUrl()
      },
      maxWidth: '550px',
      panelClass: 'whatsapp-dialog-panel'
    });
  }

  private buildShareText(caption?: string): string {
    const body = caption || this.promotion.campaign?.caption || 'Visit the link for more details.';
    return `Ad - ${this.promotion.upi}\nVisit ${this.getPromotionUrl()} for more.\n${body}`;
  }

  private normalizeAssetUrl(url?: string): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return `${this.api.replace(/\/$/, '')}${url}`;
    return url;
  }

  private getAssetFileName(assetUrl: string): string {
    const title = this.promotion.campaign?.title || `marketspase-ad-${this.promotion.upi}`;
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'marketspase-ad';
    const extension = this.getAssetExtension(assetUrl);
    return `${safeTitle}-${this.promotion.upi}.${extension}`;
  }

  private getAssetExtension(assetUrl: string): string {
    try {
      const path = new URL(assetUrl, window.location.origin).pathname;
      const match = path.match(/\.([a-z0-9]+)$/i);
      if (match?.[1]) return match[1].toLowerCase();
    } catch {}

    return this.promotion.campaign?.mediaType === 'video' ? 'mp4' : 'jpg';
  }

  private async copyText(text: string, successMessage: string): Promise<void> {
    try {
      this.isSharing.set(true);
      await navigator.clipboard.writeText(text);
      this.snackBar.open(successMessage, 'OK', { duration: 3000 });
    } catch (err) {
      console.error('Failed to copy promotion text:', err);
      this.snackBar.open('Unable to copy. Please try again.', 'OK', { duration: 3000 });
    } finally {
      this.isSharing.set(false);
    }
  }
}
