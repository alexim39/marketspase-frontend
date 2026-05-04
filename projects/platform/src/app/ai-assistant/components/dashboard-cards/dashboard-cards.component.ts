// dashboard-cards.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Stats } from '../../models/assistant.model';

@Component({
  selector: 'app-dashboard-cards',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `
    <div class="cards-container">
      <mat-card class="stat-card">
        <h3 class="stat-value">{{ stats?.totalMessages ?? '--' }}</h3>
        <p class="stat-label">Total Messages</p>
      </mat-card>
      <mat-card class="stat-card">
        <h3 class="stat-value">{{ stats?.aiHandled ?? '--' }}</h3>
        <p class="stat-label">AI Handled</p>
      </mat-card>
      <mat-card class="stat-card">
        <h3 class="stat-value">{{ stats?.responseTime ?? '--' }}s</h3>
        <p class="stat-label">Avg Response</p>
      </mat-card>
    </div>
  `,
  styles: [`
    .cards-container {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .stat-card {
      flex: 1 1 150px;
      text-align: center;
      padding: 16px;
      background: var(--surface-color);
    }
    .stat-value {
      margin: 0;
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .stat-label {
      margin: 0;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  `]
})
export class DashboardCardsComponent {
  @Input() stats: Stats | null = null;
}