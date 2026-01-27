// shared/services/share.service.ts
import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ShareData {
  title: string;
  text: string;
  url: string;
}

@Injectable()
export class ShareService {
  private snackBar = inject(MatSnackBar);

  /**
   * Share content using Web Share API or fallback methods
   */
  async share(data: ShareData, platform?: 'whatsapp' | 'facebook' | 'twitter' | 'copy'): Promise<void> {
    // If platform is specified, use platform-specific sharing
    if (platform) {
      this.shareToPlatform(data, platform);
      return;
    }

    // Try Web Share API first (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: data.text,
          url: data.url
        });
        this.showSuccess('Shared successfully!');
        return;
      } catch (error: any) {
        // User canceled the share
        if (error.name === 'AbortError') {
          return;
        }
        console.warn('Web Share API failed:', error);
      }
    }

    // Fallback: Copy to clipboard
    this.copyToClipboard(data.url);
  }

  /**
   * Share to specific social media platforms
   */
  private shareToPlatform(data: ShareData, platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy'): void {
    const encodedUrl = encodeURIComponent(data.url);
    const encodedText = encodeURIComponent(`${data.text}\n\n${data.url}`);

    let shareUrl = '';

    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}`;
        break;
      
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      
      case 'twitter':
        const tweetText = encodeURIComponent(`${data.title}\n\n${data.url}`);
        shareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
        break;
      
      case 'copy':
        this.copyToClipboard(data.url);
        return;
    }

    if (shareUrl) {
      this.openShareWindow(shareUrl);
    }
  }

  /**
   * Open share URL in new window
   */
  private openShareWindow(url: string): void {
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      url,
      'share',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,status=0`
    );
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.showSuccess('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          this.showSuccess('Copied to clipboard!');
        } else {
          this.showError('Failed to copy to clipboard');
        }
      } catch (fallbackError) {
        this.showError('Failed to copy to clipboard');
      }
    }
  }

  /**
   * Generate WhatsApp message with product details
   */
  generateWhatsAppMessage(product: any): string {
    const message = `🎯 *${product.name}*\n\n` +
                   `💰 Price: $${product.price}\n` +
                   `🎁 Commission: ${product.promotion?.commissionRate || 15}%\n\n` +
                   `📦 Category: ${product.category}\n` +
                   `🏪 Store: ${product.store?.name || 'Unknown Store'}\n\n` +
                   `👉 Promo Link: ${window.location.origin}/promote/${product.promotion?.trackingCode || product._id}\n\n` +
                   `#${product.category.replace(/\s+/g, '')} #Promotion`;
    
    return message;
  }

  /**
   * Generate Facebook share URL
   */
  generateFacebookShareUrl(url: string): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  }

  /**
   * Generate Twitter share URL
   */
  generateTwitterShareUrl(text: string, url: string): string {
    const tweetText = encodeURIComponent(`${text.substring(0, 100)}...`);
    return `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(url)}`;
  }

  /**
   * Generate email share link
   */
  generateEmailShareLink(subject: string, body: string): string {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
  }

  /**
   * Generate SMS share link
   */
  generateSmsShareLink(text: string): string {
    const encodedText = encodeURIComponent(text);
    return `sms:?&body=${encodedText}`;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
}