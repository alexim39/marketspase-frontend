import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AiAssistantService } from '../../services/ai-assistant.service';

interface DailyPoint {
  date: string;
  count: number;
}

interface ActivityPoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  providers: [AiAssistantService],
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private aiService = inject(AiAssistantService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  stats: any = {};
  loading = true;

  ngOnInit(): void {
    this.loadAnalytics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.aiService.getAnalytics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.stats = res.data || {};
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Could not load AI analytics', 'Close', { duration: 5000 });
        },
      });
  }

  get dailyConversations(): DailyPoint[] {
    return this.stats.dailyConversations || [];
  }

  get aiVsHumanActivity(): ActivityPoint[] {
    return this.stats.aiVsHumanActivity || [
      { label: 'AI', value: this.stats.aiHandled || 0 },
      { label: 'Human', value: this.stats.humanHandled || 0 },
    ];
  }

  get maxDailyCount(): number {
    return Math.max(1, ...this.dailyConversations.map(point => point.count || 0));
  }

  get maxActivityValue(): number {
    return Math.max(1, ...this.aiVsHumanActivity.map(point => point.value || 0));
  }

  get conversionTrend(): DailyPoint[] {
    return this.stats.conversionTrends || [];
  }

  get hasConversationData(): boolean {
    return this.dailyConversations.some(point => point.count > 0);
  }

  barHeight(value: number, max: number): string {
    const percentage = Math.max(6, Math.round(((value || 0) / max) * 100));
    return `${percentage}%`;
  }

  formatDay(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-NG', { weekday: 'short' });
  }
}
