import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { AiAssistantSettingsService } from '../settings/services/settings.service';
import { SocketService } from '../../services/socket.service';
import { UserService } from '../../../common/services/user.service';
import { AiAssistantSettingsAPiService } from '../../services/ai-assistant-api.service';

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
    MatBadgeModule,
    RouterLink
  ],
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  providers: [AiAssistantService, AiAssistantSettingsService, AiAssistantSettingsAPiService]
})
export class OverviewComponent implements OnInit, OnDestroy {
  private aiService = inject(AiAssistantService);
  private settingsService = inject(AiAssistantSettingsService);
  private socketService = inject(SocketService);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  stats: any = {};
  aiEnabled = false;
  hasSubscription = false;
  currentPlanId = '';
  recentConversations: any[] = [];
  loading = true;
  statsLoading = true;
  conversationsLoading = true;
  error: string | null = null;

  ngOnInit(): void {
    const userId = this.userService.user()?._id;
    if (userId) {
      this.socketService.connect(userId);
    }
    this.loadData();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSocketListeners(): void {
    this.socketService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadConversations();
        this.loadStats();
      });
  }

  loadData(): void {
    this.loadStats();
    this.loadConversations();
    this.loadSettings();
  }

  loadStats(): void {
    this.statsLoading = true;
    this.aiService.getStats().subscribe({
      next: (res: any) => { 
        this.stats = res.data; 
        this.statsLoading = false;
        this.updateLoadingState();
      },
      error: (err) => {
        this.error = 'Failed to load stats';
        this.statsLoading = false;
        this.updateLoadingState();
      }
    });
  }

  loadConversations(): void {
    this.conversationsLoading = true;
    this.aiService.getConversations(undefined, 1, 5).subscribe({
      next: (convs) => { 
        this.recentConversations = convs; 
        this.conversationsLoading = false;
        this.updateLoadingState();
      },
      error: () => {
        this.conversationsLoading = false;
        this.updateLoadingState();
      }
    });
  }

  loadSettings(): void {
    this.settingsService.loadCurrentPlan();
    this.settingsService.currentPlanId$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (planId) => {
        this.currentPlanId = planId;
        this.hasSubscription = !!planId && planId !== 'none';
      }
    });

    this.settingsService.aiSettings$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (settings: any) => { 
        this.aiEnabled = settings?.aiEnabled ?? false; 
      }
    });
  }

  private updateLoadingState(): void {
    this.loading = this.statsLoading || this.conversationsLoading;
  }

  toggleAI(): void {
    if (!this.hasSubscription) {
      return;
    }
    this.aiService.toggleAI(!this.aiEnabled, this.userService.user()?._id ?? '').subscribe({
      next: () => { this.aiEnabled = !this.aiEnabled; }
    });
  }
}