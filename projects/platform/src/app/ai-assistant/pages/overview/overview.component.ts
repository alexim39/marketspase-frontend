import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AiAssistantService, Conversation } from '../../services/ai-assistant.service';
import { SocketService } from '../../services/socket.service';
import { UserService } from '../../../common/services/user.service';

@Component({
  selector: 'app-overview',
  standalone: true,
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
export class OverviewComponent implements OnInit, OnDestroy {
  private aiService = inject(AiAssistantService);
  private socketService = inject(SocketService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  stats: any = {};
  settings: any = {};
  recentConversations: Conversation[] = [];
  loading = true;
  savingToggle = false;
  testMessage = 'Is it available and how much is delivery?';
  testReply = '';

  ngOnInit(): void {
    const userId = this.userService.user()?._id;
    if (userId) this.socketService.connect(userId);
    this.loadData();

    this.socketService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData(false));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(showLoader = true): void {
    if (showLoader) this.loading = true;
    forkJoin({
      stats: this.aiService.getStats(),
      settings: this.aiService.getSettings(),
      conversations: this.aiService.getConversations(undefined, 1, 5)
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ stats, settings, conversations }: any) => {
        this.stats = stats.data || {};
        this.settings = settings.data || {};
        this.recentConversations = conversations || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Could not load AI Assistant overview', 'Close', { duration: 5000 });
      }
    });
  }

  toggleAI(): void {
    this.savingToggle = true;
    const nextState = !this.settings.aiEnabled;
    this.aiService.toggleAI(nextState).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        this.settings = res.data || { ...this.settings, aiEnabled: nextState };
        this.stats.aiEnabled = nextState;
        this.savingToggle = false;
        this.snackBar.open(nextState ? 'AI Assistant is now active' : 'AI Assistant is paused', 'Close', { duration: 3000 });
      },
      error: () => {
        this.savingToggle = false;
        this.snackBar.open('Could not update AI status', 'Close', { duration: 5000 });
      }
    });
  }

  testAI(): void {
    this.testReply = '';
    this.aiService.testAssistant(this.testMessage).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => this.testReply = res.data?.reply || '',
      error: () => this.snackBar.open('Test failed. Check your setup and try again.', 'Close', { duration: 5000 })
    });
  }

  get hasSetup(): boolean {
    return !!this.settings.aiEnabled || (this.stats.totalFaqs || 0) > 0 || (this.stats.connectedWhatsapp || 0) > 0;
  }

  get connectedText(): string {
    const count = this.stats.connectedWhatsapp || 0;
    return count > 0 ? `${count} number${count === 1 ? '' : 's'} added` : 'No WhatsApp number yet';
  }

  getConversationName(conversation: Conversation): string {
    return conversation.customerName && conversation.customerName !== 'Customer'
      ? conversation.customerName
      : conversation.customerWaId;
  }
}
