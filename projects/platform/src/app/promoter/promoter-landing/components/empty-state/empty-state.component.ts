import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <i class="material-icons empty-icon">campaign</i>
      <h3>No campaigns available</h3>
      <p>Check back later for new promotion opportunities or change your ads preferences settings</p>
      <a class="setting-button" mat-raised-button routerLink="/dashboard/settings/system">
        <i class="material-icons">arrow_forward</i> Change Settings
      </a>
    </div>
  `,
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {}