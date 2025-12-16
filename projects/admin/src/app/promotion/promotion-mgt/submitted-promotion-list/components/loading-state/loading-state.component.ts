import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatCardModule],
  template: `
    <div class="loading-container" [class.fullscreen]="fullscreen">
      @if (showCard) {
        <mat-card class="loading-card">
          <mat-card-content>
            <div class="loading-content">
              <mat-progress-spinner
                [mode]="mode"
                [diameter]="size"
                [strokeWidth]="strokeWidth"
                [color]="color">
              </mat-progress-spinner>
              
              @if (message || showDots) {
                <div class="loading-text">
                  @if (message) {
                    <p class="loading-message">{{ message }}</p>
                  }
                  @if (showDots) {
                    <div class="loading-dots">
                      <span class="dot"></span>
                      <span class="dot"></span>
                      <span class="dot"></span>
                    </div>
                  }
                </div>
              }
              
              @if (subMessage) {
                <p class="loading-submessage">{{ subMessage }}</p>
              }
              
              @if (showProgress && progress !== undefined) {
                <div class="progress-container">
                  <div class="progress-bar" [style.width.%]="progress"></div>
                  <span class="progress-text">{{ progress }}%</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="loading-content">
          <mat-progress-spinner
            [mode]="mode"
            [diameter]="size"
            [strokeWidth]="strokeWidth"
            [color]="color">
          </mat-progress-spinner>
          
          @if (message || showDots) {
            <div class="loading-text">
              @if (message) {
                <p class="loading-message">{{ message }}</p>
              }
              @if (showDots) {
                <div class="loading-dots">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      
      &.fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        z-index: 1000;
        padding: 0;
      }
    }
    
    .loading-card {
      max-width: 400px;
      width: 100%;
      box-shadow: 0 4px 20px rgba(133, 132, 132, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 32px;
      text-align: center;
    }
    
    .loading-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }
    
    .loading-message {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: rgba(163, 160, 160, 0.87);
    }
    
    .loading-dots {
      display: flex;
      gap: 4px;
      
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3f51b5;
        animation: bounce 1.4s infinite ease-in-out both;
        
        &:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        &:nth-child(2) {
          animation-delay: -0.16s;
        }
      }
    }
    
    .loading-submessage {
      margin: 0;
      font-size: 14px;
      color: rgba(138, 138, 138, 0.6);
      max-width: 300px;
    }
    
    .progress-container {
      width: 100%;
      max-width: 200px;
      background: #e0e0e0;
      border-radius: 10px;
      height: 8px;
      overflow: hidden;
      position: relative;
      margin-top: 8px;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #3f51b5, #2196f3);
      border-radius: 10px;
      transition: width 0.3s ease;
    }
    
    .progress-text {
      position: absolute;
      top: -24px;
      right: 0;
      font-size: 12px;
      font-weight: 500;
      color: #3f51b5;
    }
    
    @keyframes bounce {
      0%, 80%, 100% {
        transform: scale(0);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @media (max-width: 768px) {
      .loading-content {
        padding: 24px;
        gap: 16px;
      }
      
      .loading-message {
        font-size: 14px;
      }
      
      .loading-submessage {
        font-size: 12px;
      }
    }
  `]
})
export class LoadingStateComponent {
  @Input() size = 40;
  @Input() strokeWidth = 4;
  @Input() color = 'primary';
  @Input() mode: 'determinate' | 'indeterminate' = 'indeterminate';
  @Input() message = 'Loading...';
  @Input() subMessage?: string;
  @Input() showDots = false;
  @Input() showProgress = false;
  @Input() progress?: number;
  @Input() showCard = true;
  @Input() fullscreen = false;
}