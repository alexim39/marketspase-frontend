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
  public isStatusSharing = signal<boolean>(false);

  private promoterService = inject(PromoterService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  public readonly api = this.promoterService.api;

  isPromotionRestricted(): boolean {
    const reviewStatus = this.promotion?.fraudStatus?.reviewStatus;
    return Boolean(
      this.promotion?.fraudStatus?.isFlagged &&
      reviewStatus &&
      ['warning', 'final_warning', 'blocked'].includes(reviewStatus)
    ) || this.promotion?.isActive === false && Boolean(this.promotion?.fraudStatus?.isFlagged);
  }

  getRestrictionSummary(): string {
    return this.promotion?.fraudStatus?.reasonSummary
      || 'This promotion link is paused while MarketSpase reviews suspicious traffic on it.';
  }

  getPromotionUrl(): string {
    if (this.promotion.promotionUrl) return this.promotion.promotionUrl;
    return `${this.api.replace(/\/$/, '')}/api/v1/campaign/track/${this.promotion.upi}`;
  }

  getAssetUrl(): string {
    return this.normalizeAssetUrl(this.promotion.campaign?.mediaUrl);
  }

  getPreviewUrl(): string {
    return this.normalizeAssetUrl(this.promotion.campaign?.thumbnailUrl || this.promotion.campaign?.mediaUrl);
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
      paid: 'Paid',
      rejected: 'Needs Attention'
    };
    return labels[status] || 'Promotion';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      accepted: 'success',
      paid: 'primary',
      rejected: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      accepted: 'link',
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

  getMarketerId(): string | null {
    const owner = this.promotion?.campaign?.owner as { _id?: string | null } | string | null | undefined;
    if (!owner) {
      return null;
    }

    if (typeof owner === 'string') {
      return owner;
    }

    return owner._id || null;
  }

  viewDetails(): void {
    if (this.promotion) {
      this.router.navigate(['/dashboard/campaigns/promotions', this.promotion._id]);
    }
  }

  openPromotionRoom(): void {
    this.router.navigate(['/dashboard/campaigns/collaboration'], {
      queryParams: { promotionId: this.promotion._id }
    });
  }

  messageMarketer(): void {
    const marketerId = this.getMarketerId();
    this.router.navigate(['/dashboard/campaigns/collaboration'], {
      queryParams: {
        promotionId: this.promotion._id,
        campaignId: this.promotion.campaign?._id || null,
        targetUserId: marketerId || null,
      }
    });
  }

  openPromotionLink(): void {
    if (this.isPromotionRestricted()) {
      this.snackBar.open('This promotion link is paused while fraud checks are in progress.', 'OK', { duration: 3500 });
      return;
    }
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
    if (this.isPromotionRestricted()) {
      this.snackBar.open('This promotion link is paused and cannot be copied right now.', 'OK', { duration: 3500 });
      return;
    }
    this.copyText(this.getPromotionUrl(), 'Promotion link copied');
  }

  copyCaption(caption?: string): void {
    if (this.isPromotionRestricted()) {
      this.snackBar.open('Sharing is paused on this promotion while it is under review.', 'OK', { duration: 3500 });
      return;
    }
    this.copyText(this.buildShareText(caption), 'Caption and tracked link copied');
  }

  showWhatsAppSharingInstructions(promotion: PromotionInterface): void {
    if (this.isPromotionRestricted()) {
      this.snackBar.open('This promotion is paused while suspicious traffic is being reviewed.', 'OK', { duration: 3500 });
      return;
    }

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
    const title = this.promotion.campaign?.title?.trim() || 'Featured offer on MarketSpase';
    const body = this.truncateText(
      caption || this.promotion.campaign?.caption || 'Open the link for the full offer details.',
      220
    );

    return [
      'Tap this MarketSpase offer now for the full details:',
      this.getPromotionUrl(),
      '',
      title,
      body,
      '',
      `Track Ref: ${this.promotion.upi}`
    ].join('\n');
  }

  async shareToWhatsAppStatus(): Promise<void> {
    if (this.isPromotionRestricted()) {
      this.snackBar.open('This promotion is paused while suspicious traffic is being reviewed.', 'OK', { duration: 3500 });
      return;
    }

    const assetUrl = this.getAssetUrl();
    if (!assetUrl) {
      this.snackBar.open('Campaign media is not available for WhatsApp Status yet.', 'OK', { duration: 3500 });
      return;
    }

    const shareText = this.buildShareText(this.promotion.campaign?.caption);
    const shareTitle = this.promotion.campaign?.title || 'Promotion on MarketSpase';

    try {
      this.isStatusSharing.set(true);

      const shareFile = await this.createShareFile(assetUrl);
      const shareData: ShareData = {
        title: shareTitle,
        text: shareText,
        files: [shareFile]
      };

      if (typeof navigator.share !== 'function') {
        throw new Error('native-share-unavailable');
      }

      if (typeof navigator.canShare === 'function' && !this.canShareFiles(shareData)) {
        throw new Error('native-file-share-unavailable');
      }

      await navigator.share(shareData);

      this.snackBar.open(
        'Share ready. Choose WhatsApp, then tap My Status to post it.',
        'OK',
        { duration: 5000, panelClass: ['whatsapp-snackbar'] }
      );
    } catch (err) {
      if (this.isShareCanceled(err)) {
        return;
      }

      console.warn('Native WhatsApp status share fell back to manual flow:', err);
      await this.handleManualStatusShareFallback(assetUrl, shareText);
    } finally {
      this.isStatusSharing.set(false);
    }
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

  private async createShareFile(assetUrl: string): Promise<File> {
    const response = await fetch(assetUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch campaign media for sharing: ${response.status}`);
    }

    const blob = await response.blob();
    const mimeType = blob.type || this.getFallbackMimeType();
    const extension = this.getFileExtensionForMimeType(mimeType) || this.getAssetExtension(assetUrl);
    const fileName = this.getAssetFileNameWithExtension(extension);

    return new File([blob], fileName, {
      type: mimeType,
      lastModified: Date.now()
    });
  }

  private getAssetFileNameWithExtension(extension: string): string {
    const title = this.promotion.campaign?.title || `marketspase-promotion-${this.promotion.upi}`;
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'marketspase-promotion';
    return `${safeTitle}-${this.promotion.upi}.${extension}`;
  }

  private getFallbackMimeType(): string {
    return this.promotion.campaign?.mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
  }

  private getFileExtensionForMimeType(mimeType: string): string {
    const normalizedMimeType = mimeType.toLowerCase();

    if (normalizedMimeType.includes('mp4')) return 'mp4';
    if (normalizedMimeType.includes('quicktime')) return 'mov';
    if (normalizedMimeType.includes('webm')) return 'webm';
    if (normalizedMimeType.includes('png')) return 'png';
    if (normalizedMimeType.includes('gif')) return 'gif';
    if (normalizedMimeType.includes('webp')) return 'webp';
    if (normalizedMimeType.includes('jpeg') || normalizedMimeType.includes('jpg')) return 'jpg';

    return '';
  }

  private canShareFiles(shareData: ShareData): boolean {
    try {
      return navigator.canShare(shareData);
    } catch {
      return false;
    }
  }

  private isShareCanceled(err: unknown): boolean {
    return err instanceof DOMException && err.name === 'AbortError';
  }

  private async handleManualStatusShareFallback(assetUrl: string, shareText: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (clipboardError) {
      console.warn('Failed to copy WhatsApp status caption automatically:', clipboardError);
    }

    window.open(assetUrl, '_blank', 'noopener');

    this.snackBar.open(
      'We copied your caption and opened the ad media. Add it to WhatsApp Status and paste the caption.',
      'OK',
      { duration: 5500, panelClass: ['whatsapp-snackbar'] }
    );
  }

  private truncateText(value: string, maxLength: number): string {
    const normalizedValue = value.trim();
    if (normalizedValue.length <= maxLength) {
      return normalizedValue;
    }

    return `${normalizedValue.slice(0, maxLength - 1).trimEnd()}...`;
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
