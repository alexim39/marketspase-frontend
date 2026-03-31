// promoted-products/components/share-promotion-dialog/share-promotion-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'share-promotion-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule],
  templateUrl: './share-promotion-dialog.component.html',
  styleUrls: ['./share-promotion-dialog.component.scss']
})
export class SharePromotionDialogComponent {
  shareLink: string;
  productName: string;
  commissionRate: number;
  trackingCode: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SharePromotionDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.shareLink = data.shareLink;
    this.productName = data.productName;
    this.commissionRate = data.commissionRate;
    this.trackingCode = data.trackingCode;
  }

  copyLink(): void {
    navigator.clipboard.writeText(this.shareLink).then(() => {
      this.snackBar.open('Link copied to clipboard!', 'Close', { duration: 2000 });
    });
  }

  shareOnWhatsApp(): void {
    const message = `🚀 Check out this amazing product!\n\n` +
      `📦 *${this.productName}*\n` +
      `💰 Earn ${this.commissionRate}% commission on every sale!\n\n` +
      `👇 Click to start earning:\n` +
      `${this.shareLink}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    this.dialogRef.close();
  }

  shareOnFacebook(): void {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.shareLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
    this.dialogRef.close();
  }

  shareOnTwitter(): void {
    const text = `Check out ${this.productName} and earn ${this.commissionRate}% commission!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(this.shareLink)}`;
    window.open(url, '_blank', 'width=600,height=400');
    this.dialogRef.close();
  }

  shareViaEmail(): void {
    const subject = `Check out this product: ${this.productName}`;
    const body = `I'm promoting this great product and you can earn commissions too!\n\n${this.shareLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    this.dialogRef.close();
  }

  close(): void {
    this.dialogRef.close();
  }
}