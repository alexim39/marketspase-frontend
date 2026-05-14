import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AiAssistantService, Conversation } from '../../services/ai-assistant.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    RouterLink,
    FormsModule
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  providers: [AiAssistantService]
})
export class OverviewComponent implements OnInit {
  private aiService = inject(AiAssistantService);
  private socketService = inject(SocketService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  readonly stats = signal<any>({});
  readonly settings = signal<any>({});
  readonly recentConversations = signal<Conversation[]>([]);
  readonly loading = signal(true);
  readonly savingToggle = signal(false);
  readonly testMessage = signal('Is it available and how much is delivery?');
  readonly testReply = signal('');
  readonly hasSetup = computed(() => {
    const settings = this.settings();
    const stats = this.stats();
    return !!settings.aiEnabled || (stats.totalFaqs || 0) > 0 || (stats.connectedWhatsapp || 0) > 0;
  });
  readonly connectedText = computed(() => {
    const count = this.stats().connectedWhatsapp || 0;
    return count > 0 ? `${count} number${count === 1 ? '' : 's'} added` : 'No WhatsApp number yet';
  });
  readonly quickStats = computed(() => {
    const stats = this.stats();
    return [
      { label: 'Messages today', value: stats.messagesToday || 0, icon: 'today' },
      { label: 'AI handled', value: `${stats.aiHandledPercent || 0}%`, icon: 'smart_toy' },
      { label: 'Human handled', value: `${stats.humanHandledPercent || 0}%`, icon: 'support_agent' },
      { label: 'Avg response', value: `${stats.responseTime || 0}s`, icon: 'speed' },
      { label: 'Escalated chats', value: stats.escalatedCount || 0, icon: 'priority_high' },
      { label: 'Est. conversions', value: stats.estimatedConversions || 0, icon: 'shopping_bag' }
    ];
  });

  ngOnInit(): void {
    this.loadData();

    this.socketService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData(false));
  }

  loadData(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    forkJoin({
      stats: this.aiService.getStats(),
      settings: this.aiService.getSettings(),
      conversations: this.aiService.getConversations(undefined, 1, 5)
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ stats, settings, conversations }: any) => {
        this.stats.set(stats.data || {});
        this.settings.set(settings.data || {});
        this.recentConversations.set(conversations || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Could not load AI Assistant overview', 'Close', { duration: 5000 });
      }
    });
  }

  toggleAI(): void {
    this.savingToggle.set(true);
    const nextState = !this.settings().aiEnabled;
    this.aiService.toggleAI(nextState).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => {
        this.settings.set(res.data || { ...this.settings(), aiEnabled: nextState });
        this.stats.update(stats => ({ ...stats, aiEnabled: nextState }));
        this.savingToggle.set(false);
        this.snackBar.open(nextState ? 'AI Assistant is now active' : 'AI Assistant is paused', 'Close', { duration: 3000 });
      },
      error: () => {
        this.savingToggle.set(false);
        this.snackBar.open('Could not update AI status', 'Close', { duration: 5000 });
      }
    });
  }

  testAI(): void {
    this.testReply.set('');
    this.aiService.testAssistant(this.testMessage()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res: any) => this.testReply.set(res.data?.reply || ''),
      error: () => this.snackBar.open('Test failed. Check your setup and try again.', 'Close', { duration: 5000 })
    });
  }

  getConversationName(conversation: Conversation): string {
    return conversation.customerName && conversation.customerName !== 'Customer'
      ? conversation.customerName
      : conversation.customerWaId;
  }
}
