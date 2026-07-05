import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ApiService } from '@shared/services/api';

@Component({
  selector: 'app-daily-suggestions-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule],
  template: `
    @if (suggestions().length) {
      <mat-card class="suggestions-card">
        <mat-card-content>
          <div class="suggestions-header">
            <mat-icon>auto_awesome</mat-icon>
            <div>
              <h3>Daily Growth Tips</h3>
              <span>AI-powered suggestions for your business</span>
            </div>
          </div>
          <div class="suggestions-list">
            @for (s of suggestions(); track $index) {
              <div class="suggestion-item">
                <span class="num">{{ $index + 1 }}</span>
                <p>{{ s }}</p>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .suggestions-card { border-radius: 14px; border: 1px solid rgba(var(--primary-rgb), 0.12); background: linear-gradient(135deg, var(--surface-color) 0%, rgba(var(--primary-rgb), 0.02) 100%); margin-bottom: 16px; }
    .suggestions-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; mat-icon { color: var(--primary-color); font-size: 28px; width: 28px; height: 28px; } h3 { margin: 0; font-size: 1rem; font-weight: 700; } span { font-size: 0.75rem; color: var(--text-tertiary); } }
    .suggestions-list { display: flex; flex-direction: column; gap: 10px; }
    .suggestion-item { display: flex; gap: 10px; .num { width: 24px; height: 24px; border-radius: 50%; background: rgba(var(--primary-rgb), 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; margin-top: 1px; } p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; } }
  `]
})
export class DailySuggestionsCardComponent implements OnInit {
  private api = inject(ApiService);
  suggestions = signal<string[]>([]);

  ngOnInit(): void {
    this.api.get<any>('api/v1/social/suggestions/daily', undefined, undefined, true).subscribe({
      next: (r: any) => this.suggestions.set(r?.data || []),
      error: () => {}
    });
  }
}
