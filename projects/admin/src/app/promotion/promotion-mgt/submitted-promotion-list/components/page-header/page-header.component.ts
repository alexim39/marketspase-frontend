import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatDividerModule],
  template: `
    <div class="page-header" [class.with-border]="withBorder" [class.with-background]="withBackground">
      <div class="header-main">
        <div class="header-left">
          @if (backButton) {
            <button mat-icon-button 
                    class="back-button"
                    [matTooltip]="backTooltip || 'Go back'"
                    (click)="onBack.emit()">
              <mat-icon>arrow_back</mat-icon>
            </button>
          }
          
          <div class="header-content">
            @if (icon) {
              <mat-icon class="header-icon">{{ icon }}</mat-icon>
            }
            
            <div class="header-text">
              <h1 class="header-title">
                {{ title }}
                @if (badge) {
                  <span class="header-badge" [class]="badgeClass">{{ badge }}</span>
                }
              </h1>
              
              @if (subtitle) {
                <p class="header-subtitle">{{ subtitle }}</p>
              }
            </div>
          </div>
        </div>
        
        <div class="header-right">
          @if (actionButton) {
            <button mat-flat-button 
                    [color]="actionColor || 'primary'"
                    [matTooltip]="actionTooltip || ''"
                    (click)="onAction.emit()">
              @if (actionIcon) {
                <mat-icon>{{ actionIcon }}</mat-icon>
              }
              {{ actionButton }}
            </button>
          }
          
          <ng-content select="[header-actions]"></ng-content>
        </div>
      </div>
      
      @if (showDivider) {
        <mat-divider class="header-divider"></mat-divider>
      }
      
      @if (description || extraContent) {
        <div class="header-description">
          @if (description) {
            <p class="description-text">{{ description }}</p>
          }
          <ng-content></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 32px;
      
      &.with-border {
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 24px;
      }
      
      &.with-background {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        padding: 24px;
        border-radius: 12px;
        margin-bottom: 24px;
      }
    }
    
    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 16px;
    }
    
    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      flex: 1;
    }
    
    .back-button {
      margin-top: 8px;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }
    
    .header-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #3f51b5;
      flex-shrink: 0;
    }
    
    .header-text {
      flex: 1;
    }
    
    .header-title {
      margin: 0 0 4px 0;
      font-size: 28px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.87);
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .header-badge {
      font-size: 12px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 12px;
      background: #3f51b5;
      color: white;
      
      &.primary { background: #3f51b5; }
      &.accent { background: #ff4081; }
      &.warn { background: #f44336; }
      &.success { background: #4caf50; }
      &.info { background: #2196f3; }
    }
    
    .header-subtitle {
      margin: 0;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.5;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    
    .header-divider {
      margin: 16px 0;
    }
    
    .header-description {
      margin-top: 16px;
      
      .description-text {
        margin: 0;
        font-size: 14px;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.6;
        max-width: 800px;
      }
    }
    
    @media (max-width: 768px) {
      .page-header.with-background {
        padding: 16px;
      }
      
      .header-main {
        flex-direction: column;
        gap: 16px;
      }
      
      .header-left {
        width: 100%;
      }
      
      .header-right {
        width: 100%;
        justify-content: flex-start;
      }
      
      .header-title {
        font-size: 24px;
      }
      
      .header-content {
        gap: 12px;
      }
      
      .header-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
    
    @media (max-width: 480px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .header-title {
        font-size: 20px;
      }
    }
  `]
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
  @Input() description?: string;
  @Input() icon?: string;
  @Input() badge?: string;
  @Input() badgeClass: 'primary' | 'accent' | 'warn' | 'success' | 'info' = 'primary';
  
  // Back button
  @Input() backButton = false;
  @Input() backTooltip?: string;
  
  // Action button
  @Input() actionButton?: string;
  @Input() actionIcon?: string;
  @Input() actionColor?: 'primary' | 'accent' | 'warn';
  @Input() actionTooltip?: string;
  
  // Styling
  @Input() withBorder = false;
  @Input() withBackground = false;
  @Input() showDivider = false;
  @Input() extraContent = false;
  
  // Events
  @Output() onBack = new EventEmitter<void>();
  @Output() onAction = new EventEmitter<void>();
}