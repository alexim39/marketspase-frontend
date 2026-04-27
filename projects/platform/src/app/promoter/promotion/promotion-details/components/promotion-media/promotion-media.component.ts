import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PromotionInterface } from '../../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-promotion-media',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './promotion-media.component.html',
  styleUrls: ['./promotion-media.component.scss']
})
export class PromotionMediaComponent {
  @Input() promotion!: PromotionInterface;
  @Output() share = new EventEmitter<void>();

  download() {
    //console.log('Initiating download for media:', this.promotion.campaign);
    const mediaUrl = this.promotion.campaign.mediaUrl;
    
    if (!mediaUrl) {
      console.error('Media URL is not available');
      return;
    }
    
    fetch(mediaUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.promotion.campaign.title}.${this.getFileExtension(mediaUrl)}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Download failed:', error);
        // Fallback to opening in new tab
        window.open(mediaUrl, '_blank');
      });
  }

  private getFileExtension(url: string): string {
    const extension = url.split('.').pop()?.split('?')[0] || '';
    return extension;
  }
}