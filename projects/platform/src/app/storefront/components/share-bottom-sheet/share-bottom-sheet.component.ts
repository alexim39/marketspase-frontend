// components/share-bottom-sheet/share-bottom-sheet.component.ts
import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TruncatePipe } from '../../../store/shared';

export interface ShareData {
  title: string;
  text: string;
  url: string;
  image?: string;
}

@Component({
  selector: 'app-share-bottom-sheet',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    TruncatePipe
  ],
  templateUrl: './share-bottom-sheet.component.html',
  styleUrls: ['./share-bottom-sheet.component.scss']
})
export class ShareBottomSheetComponent implements OnInit {
  shareOptions = signal<any[]>([
    {
      id: 'copy',
      name: 'Copy Link',
      icon: 'link',
      color: 'primary',
      description: 'Copy link to clipboard'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: 'whatsapp',
      color: '#25D366',
      description: 'Share via WhatsApp'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'facebook',
      color: '#1877F2',
      description: 'Share on Facebook'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'twitter',
      color: '#1DA1F2',
      description: 'Share on Twitter'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: 'telegram',
      color: '#0088cc',
      description: 'Share on Telegram'
    },
    {
      id: 'email',
      name: 'Email',
      icon: 'email',
      color: 'primary',
      description: 'Share via email'
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: 'sms',
      color: 'primary',
      description: 'Share via text message'
    }
  ]);

  isLoading = signal<boolean>(false);

  constructor(
    private bottomSheetRef: MatBottomSheetRef<ShareBottomSheetComponent>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: ShareData,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Check if Web Share API is available
    //if (navigator.share) {
      this.shareOptions.set([
        {
          id: 'native',
          name: 'Share',
          icon: 'share',
          color: 'primary',
          description: 'Share using device options'
        },
        ...this.shareOptions()
      ]);
    //}
  }

  share(optionId: string): void {
    this.isLoading.set(true);

    switch (optionId) {
      case 'copy':
        this.copyToClipboard();
        break;
      case 'whatsapp':
        this.shareViaWhatsApp();
        break;
      case 'facebook':
        this.shareViaFacebook();
        break;
      case 'twitter':
        this.shareViaTwitter();
        break;
      case 'telegram':
        this.shareViaTelegram();
        break;
      case 'email':
        this.shareViaEmail();
        break;
      case 'sms':
        this.shareViaSMS();
        break;
      case 'native':
        this.shareNative();
        break;
      default:
        this.copyToClipboard();
    }
  }

  private copyToClipboard(): void {
    this.clipboard.copy(this.data.url);
    this.showNotification('Link copied to clipboard!');
    this.bottomSheetRef.dismiss();
  }

  private shareViaWhatsApp(): void {
    const text = encodeURIComponent(`${this.data.text}\n\n${this.data.url}`);
    const url = `https://wa.me/?text=${text}`;
    this.openShareWindow(url);
  }

  private shareViaFacebook(): void {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(this.data.url)}&quote=${encodeURIComponent(this.data.text)}`;
    this.openShareWindow(url);
  }

  private shareViaTwitter(): void {
    const text = encodeURIComponent(`${this.data.text} ${this.data.url}`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    this.openShareWindow(url);
  }

  private shareViaTelegram(): void {
    const text = encodeURIComponent(`${this.data.text}\n\n${this.data.url}`);
    const url = `https://t.me/share/url?url=${encodeURIComponent(this.data.url)}&text=${text}`;
    this.openShareWindow(url);
  }

  private shareViaEmail(): void {
    const subject = encodeURIComponent(this.data.title);
    const body = encodeURIComponent(`${this.data.text}\n\n${this.data.url}`);
    const url = `mailto:?subject=${subject}&body=${body}`;
    window.location.href = url;
    this.bottomSheetRef.dismiss();
  }

  private shareViaSMS(): void {
    const body = encodeURIComponent(`${this.data.text}\n${this.data.url}`);
    const url = `sms:?body=${body}`;
    window.location.href = url;
    this.bottomSheetRef.dismiss();
  }

  private shareNative(): void {
    if (navigator.share) {
      const shareData: ShareData = {
        title: this.data.title,
        text: this.data.text,
        url: this.data.url
      };

      navigator.share(shareData)
        .then(() => {
          this.bottomSheetRef.dismiss();
        })
        .catch((error) => {
          console.error('Error sharing:', error);
          this.showNotification('Failed to share');
        })
        .finally(() => {
          this.isLoading.set(false);
        });
    }
  }

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
    
    this.bottomSheetRef.dismiss();
  }

  private showNotification(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  close(): void {
    this.bottomSheetRef.dismiss();
  }
}