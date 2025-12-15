import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface EmptyStateAction {
  label: string;
  icon?: string;
  color?: 'primary' | 'accent' | 'warn';
  variant?: 'basic' | 'raised' | 'stroked' | 'flat';
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="empty-state" [class.compact]="compact" [class.center]="center">
      @if (showCard) {
        <mat-card class="empty-state-card" appearance="outlined">
          <mat-card-content>
            <div class="empty-state-content">
              @if (icon) {
                <div class="empty-state-icon" [class.has-color]="iconColor">
                  <mat-icon [style.color]="iconColor">{{ icon }}</mat-icon>
                </div>
              }
              
              @if (title) {
                <h3 class="empty-state-title">{{ title }}</h3>
              }
              
              @if (description) {
                <p class="empty-state-description">{{ description }}</p>
              }
              
              @if (actions && actions.length > 0) {
                <div class="empty-state-actions">
                  @for (action of actions; track action.label) {
                    <button 
                      mat-button
                      [color]="action.color || 'primary'"
                      (click)="onActionClick(action)">
                      @if (action.icon) {
                        <mat-icon>{{ action.icon }}</mat-icon>
                      }
                      {{ action.label }}
                    </button>
                  }
                </div>
              }
              
              @if (customAction) {
                <div class="empty-state-custom-action">
                  <ng-content></ng-content>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="empty-state-content">
          @if (icon) {
            <div class="empty-state-icon" [class.has-color]="iconColor">
              <mat-icon [style.color]="iconColor">{{ icon }}</mat-icon>
            </div>
          }
          
          @if (title) {
            <h3 class="empty-state-title">{{ title }}</h3>
          }
          
          @if (description) {
            <p class="empty-state-description">{{ description }}</p>
          }
          
          @if (actions && actions.length > 0) {
            <div class="empty-state-actions">
              @for (action of actions; track action.label) {
                <button 
                  mat-button
                  [color]="action.color || 'primary'"
                  (click)="onActionClick(action)">
                  @if (action.icon) {
                    <mat-icon>{{ action.icon }}</mat-icon>
                  }
                  {{ action.label }}
                </button>
              }
            </div>
          }
          
          @if (customAction) {
            <div class="empty-state-custom-action">
              <ng-content></ng-content>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      width: 100%;
      padding: 40px 20px;
      
      &.center {
        display: flex;
        justify-content: center;
      }
      
      &.compact {
        padding: 20px;
      }
    }
    
    .empty-state-card {
      max-width: 500px;
      margin: 0 auto;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
    
    .empty-state-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      padding: 32px;
      
      .compact & {
        padding: 20px;
        gap: 12px;
      }
    }
    
    .empty-state-icon {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      
      &.has-color {
        background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
        border-radius: 50%;
        padding: 16px;
      }
      
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        opacity: 0.6;
      }
      
      .compact & {
        width: 60px;
        height: 60px;
        
        mat-icon {
          font-size: 36px;
          width: 36px;
          height: 36px;
        }
      }
    }
    
    .empty-state-title {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.87);
      
      .compact & {
        font-size: 18px;
      }
    }
    
    .empty-state-description {
      margin: 0;
      font-size: 16px;
      color: rgba(157, 156, 156, 0.6);
      line-height: 1.5;
      max-width: 400px;
      
      .compact & {
        font-size: 14px;
        max-width: 300px;
      }
    }
    
    .empty-state-actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      flex-wrap: wrap;
      justify-content: center;
      
      button {
        min-width: 120px;
        
        mat-icon {
          margin-right: 8px;
        }
      }
    }
    
    .empty-state-custom-action {
      margin-top: 16px;
      width: 100%;
    }
    
    @media (max-width: 768px) {
      .empty-state {
        padding: 20px;
      }
      
      .empty-state-content {
        padding: 24px;
      }
      
      .empty-state-actions {
        flex-direction: column;
        width: 100%;
        
        button {
          width: 100%;
          min-width: auto;
        }
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() iconColor?: string;
  @Input() title?: string;
  @Input() description?: string;
  @Input() actions: EmptyStateAction[] = [];
  @Input() customAction = false;
  @Input() showCard = true;
  @Input() compact = false;
  @Input() center = true;
  
  @Output() actionClick = new EventEmitter<EmptyStateAction>();
  
  onActionClick(action: EmptyStateAction): void {
    this.actionClick.emit(action);
  }
}