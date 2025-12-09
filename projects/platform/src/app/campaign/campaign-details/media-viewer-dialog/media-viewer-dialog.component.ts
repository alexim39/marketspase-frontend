import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface MediaViewerData {
  url: string;
  mediaType?: 'image' | 'video' | 'embed';
  title?: string;
}

@Component({
  selector: 'app-media-viewer-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './media-viewer-dialog.component.html',
  styleUrls: ['./media-viewer-dialog.component.scss']
})
export class MediaViewerOnlyDialogComponent {
  safeEmbedUrl: string | null = null;
  poster: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<MediaViewerOnlyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MediaViewerData
  ) {
    // minor heuristics for embed / video detection
    if (this.isYoutube(data.url) || this.isVimeo(data.url)) {
      this.data.mediaType = 'embed';
      this.safeEmbedUrl = this.toEmbedUrl(data.url);
    } else if (this.isVideoFile(data.url)) {
      this.data.mediaType = 'video';
      // If there is a thumbnail pattern, you can set poster
    } else {
      this.data.mediaType = 'image';
    }
  }

  close() {
    this.dialogRef.close();
  }

  async copyLink() {
    try {
      await navigator.clipboard.writeText(this.data.url);
      // optional: show toast/snack (component consumer can provide)
    } catch {
      // ignore
    }
  }

  private isVideoFile(url: string) {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
  }

  private isYoutube(url: string) {
    return /youtube\.com|youtu\.be/.test(url);
  }

  private isVimeo(url: string) {
    return /vimeo\.com/.test(url);
  }

  private toEmbedUrl(url: string) {
    // convert common youtube / vimeo links to embed URLs (simple)
    if (/youtu\.be/.test(url)) {
      const id = url.split('/').pop();
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (/youtube\.com/.test(url)) {
      const params = new URL(url).searchParams;
      const v = params.get('v');
      return v ? `https://www.youtube.com/embed/${v}` : url;
    }
    if (/vimeo\.com/.test(url)) {
      const id = url.split('/').pop();
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    return url;
  }
}