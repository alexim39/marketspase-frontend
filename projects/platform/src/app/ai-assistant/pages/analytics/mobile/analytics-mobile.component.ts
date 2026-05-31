import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { AiAssistantService } from '../../../services/ai-assistant.service';
import { AnalyticsComponent } from '../analytics.component';

@Component({
  selector: 'app-analytics-mobile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './analytics-mobile.component.html',
  styleUrls: ['./analytics-mobile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AiAssistantService],
})
export class AnalyticsMobileComponent extends AnalyticsComponent {
  readonly summaryCards = computed(() => [
    {
      label: 'Sales influence',
      value: this.stats().estimatedConversions || 0,
      helper: 'Buying conversations',
      icon: 'shopping_bag',
      tone: 'primary',
    },
    {
      label: 'Conversion rate',
      value: `${this.stats().conversionRate || 0}%`,
      helper: 'Resolved or paid leads',
      icon: 'trending_up',
      tone: 'success',
    },
    {
      label: 'Escalation rate',
      value: `${this.stats().escalationRate || 0}%`,
      helper: 'Needs human support',
      icon: 'support_agent',
      tone: 'warning',
    },
  ]);

  readonly messageMetrics = computed(() => [
    {
      label: 'Messages',
      value: this.stats().totalMessages || 0,
      helper: `${this.stats().messagesToday || 0} today`,
      icon: 'forum',
      tone: 'messages',
    },
    {
      label: 'AI handled',
      value: `${this.stats().aiHandledPercent || 0}%`,
      helper: `${this.stats().aiHandled || 0} replies`,
      icon: 'smart_toy',
      tone: 'ai',
    },
    {
      label: 'Human handled',
      value: `${this.stats().humanHandledPercent || 0}%`,
      helper: `${this.stats().humanHandled || 0} replies`,
      icon: 'person',
      tone: 'human',
    },
    {
      label: 'Response time',
      value: `${this.stats().responseTime || 0}s`,
      helper: `${this.stats().escalatedCount || 0} escalations`,
      icon: 'speed',
      tone: 'speed',
    },
  ]);

  readonly assistantMixLabel = computed(() => {
    const aiHandled = this.stats().aiHandledPercent || 0;
    if (aiHandled >= 70) return 'AI is carrying most replies';
    if (aiHandled >= 40) return 'AI and human support are balanced';
    return 'Human support is handling most replies';
  });

  readonly conversionSignalTotal = computed(() =>
    this.conversionTrend().reduce((total, point) => total + (point.count || 0), 0)
  );
}
