import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface WhatsAppInstructionsData {
  captionText: string;
  promotionTitle?: string;
}

@Component({
  selector: 'app-whatsapp-instructions-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './instruction-dialog.component.html',
  styleUrls: ['./instruction-dialog.component.scss']
})
export class WhatsAppInstructionsDialogComponent {
  private snackBar = inject(MatSnackBar);
  
  constructor(
    public dialogRef: MatDialogRef<WhatsAppInstructionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: WhatsAppInstructionsData
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  async copyCaption(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.data.captionText);
      // optional: show snackbar toast
      this.snackBar.open('Caption copied to clipboard', 'OK', { duration: 3000 });
    } catch (err) {
      console.error('Failed to copy caption:', err);
    }
  }

  openWhatsApp(): void {
    // Open WhatsApp web or app (deeplink)
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIOS) {
      window.location.href = 'whatsapp://';
    } else if (isAndroid) {
      window.location.href = 'intent://send#Intent;package=com.whatsapp;scheme=https;end';
    } else {
      window.open('https://web.whatsapp.com', '_blank');
    }
  }

  openGallery(): void {
    // Trigger file picker or gallery on mobile
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.click();
  }
}