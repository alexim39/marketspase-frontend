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
  template: `
    <div class="whatsapp-dialog">
      <div class="wa-header">
        <mat-icon class="wa-icon">whatsapp</mat-icon>
        <h2>How to Share to WhatsApp Status</h2>
        <button mat-icon-button (click)="close()" class="wa-close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="wa-content">
        <div class="wa-caption-section">
          <p class="wa-label">Copy this caption:</p>
          <div class="wa-caption-box">
            <p class="wa-caption-text">{{ data.captionText }}</p>
          </div>
          <button mat-raised-button class="wa-copy-btn" (click)="copyCaption()">
            <mat-icon>content_copy</mat-icon>
            Copy Caption
          </button>
        </div>

        <div class="wa-steps">
          <p class="wa-steps-title">Steps:</p>
          <ol class="wa-steps-list">
            <li>The media has been saved to your device</li>
            <li><strong>Copy the caption above</strong></li>
            <li>Open WhatsApp</li>
            <li>Go to the <strong>Status</strong> tab</li>
            <li>Tap the camera icon or "+" button</li>
            <li>Select <strong>Gallery/Photos</strong></li>
            <li>Choose the downloaded file</li>
            <li>Paste the caption (tap on text area)</li>
            <li>Tap the send button</li>
          </ol>
        </div>

        <div class="wa-actions">
          <button mat-raised-button class="wa-action-primary" (click)="openWhatsApp()">
            <mat-icon>open_in_new</mat-icon>
            Open WhatsApp
          </button>
          <button mat-stroked-button class="wa-action-secondary" (click)="openGallery()">
            <mat-icon>folder_open</mat-icon>
            Open Gallery
          </button>
        </div>
      </div>
    </div>
  `,
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