import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class AnalyticsComponent implements OnInit {
  private aiService = inject(AiAssistantService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly stats = signal<any>({});
  readonly loading = signal(true);
  readonly dailyConversations = computed<DailyPoint[]>(() => this.stats().dailyConversations || []);
  readonly aiVsHumanActivity = computed<ActivityPoint[]>(() => (
    this.stats().aiVsHumanActivity || [
      { label: 'AI', value: this.stats().aiHandled || 0 },
      { label: 'Human', value: this.stats().humanHandled || 0 },
    ]
  ));
  readonly maxDailyCount = computed(() =>
    Math.max(1, ...this.dailyConversations().map(point => point.count || 0))
  );
  readonly maxActivityValue = computed(() =>
    Math.max(1, ...this.aiVsHumanActivity().map(point => point.value || 0))
  );
  readonly conversionTrend = computed<DailyPoint[]>(() => this.stats().conversionTrends || []);
  readonly hasConversationData = computed(() =>
    this.dailyConversations().some(point => point.count > 0)
  );

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading.set(true);
    this.aiService.getAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.stats.set(res.data || {});
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Could not load AI analytics', 'Close', { duration: 5000 });
        },
      });
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
