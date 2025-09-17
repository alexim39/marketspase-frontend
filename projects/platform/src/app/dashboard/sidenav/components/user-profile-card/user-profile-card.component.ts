import { Component, Input, Output, EventEmitter, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserInterface } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-user-profile-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="profile-card">
      <div class="profile-info">
        <img [src]="user()!.avatar" class="profile-avatar" [alt]="user()!.displayName">
        <div class="profile-details">
          <h3 class="profile-name">{{user()!.displayName}}</h3>
          <div class="profile-meta">
            <div class="role-chip" [class]="user()!.role">
              {{user()?.role | titlecase}}
            </div>
            @if (user()?.verified) {
              <mat-icon class="verified-badge" matTooltip="Verified Account">verified</mat-icon>
            }
          </div>
        </div>
      </div>
      <button mat-icon-button class="switch-user-btn" (click)="switchUser.emit(user()!.role || 'promoter')" title="Switch user">
        <mat-icon>swap_horiz</mat-icon>
      </button>
    </div>
  `,
  styleUrls: ['./user-profile-card.component.scss'] // Using the same styles to keep it simple
})
export class UserProfileCardComponent {
  @Input({ required: true }) user!: Signal<UserInterface | null>;
  @Output() switchUser = new EventEmitter<string>();
}