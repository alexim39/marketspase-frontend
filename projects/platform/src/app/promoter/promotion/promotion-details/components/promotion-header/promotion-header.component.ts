import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-promotion-header',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <header class="header">
      <div class="container">
        <div class="header-content">
          <button class="back-btn" mat-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back to Promotions
          </button>
          <div class="header-title">
            <h1>Promotion Details</h1>
            <p>Track your promotion progress and earnings</p>
          </div>
          <div class="header-button"></div>
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./promotion-header.component.scss']
})
export class PromotionHeaderComponent {
  @Output() back = new EventEmitter<void>();
  
  goBack() {
    this.back.emit();
  }
}