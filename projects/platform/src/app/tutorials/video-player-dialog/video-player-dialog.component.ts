import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface VideoData {
  video: any;
  userRole: string;
}

@Component({
  selector: 'app-video-player-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  template: `
    <div class="video-dialog-container">
      <div class="dialog-header">
        <h2>{{ data.video.title }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="video-container">
        @if (data.video.videoType === 'youtube') {
          <iframe 
            width="100%" 
            height="100%" 
            [src]="getSafeUrl(data.video.videoUrl)"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        } @else {
          <video controls width="100%" height="100%">
            <source [src]="data.video.videoUrl" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        }
      </div>
      
      <div class="dialog-content">
        <p>{{ data.video.description }}</p>
        
        <div class="video-info">
          <div class="info-item">
            <mat-icon>schedule</mat-icon>
            <span>{{ data.video.duration }}</span>
          </div>
          <div class="info-item">
            <mat-icon>visibility</mat-icon>
            <span>{{ formatViews(data.video.views) }} views</span>
          </div>
          <div class="info-item">
            <mat-icon>school</mat-icon>
            <span class="difficulty" [class]="getDifficultyClass()">
              {{ data.video.difficulty }}
            </span>
          </div>
        </div>
        
        <div class="video-tags">
          @for (tag of data.video.tags; track tag) {
            <span class="tag">{{ tag }}</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .video-dialog-container {
      background: var(--surface-color);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      
      h2 {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }
    
    .video-container {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 aspect ratio */
      background: #000;
      
      iframe, video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }
    
    .dialog-content {
      padding: 24px;
      
      p {
        color: var(--text-secondary);
        line-height: 1.5;
        margin-bottom: 16px;
      }
    }
    
    .video-info {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      
      .info-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.875rem;
        color: var(--text-secondary);
        
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
        
        .difficulty {
          &.success { color: #10b981; }
          &.warning { color: #f59e0b; }
          &.error { color: #ef4444; }
        }
      }
    }
    
    .video-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      
      .tag {
        padding: 4px 12px;
        background: var(--background-color);
        border-radius: 20px;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
  `]
})
export class VideoPlayerDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VideoData,
    private dialogRef: MatDialogRef<VideoPlayerDialogComponent>,
    private sanitizer: DomSanitizer
  ) {}

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getDifficultyClass(): string {
    switch (this.data.video.difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return '';
    }
  }

  formatViews(views: number): string {
    if (views >= 1000000) {
      return (views / 1000000).toFixed(1) + 'M';
    }
    if (views >= 1000) {
      return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
  }

  close(): void {
    this.dialogRef.close();
  }
}