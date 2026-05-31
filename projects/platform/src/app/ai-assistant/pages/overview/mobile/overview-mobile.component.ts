import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AiAssistantService, Conversation } from '../../../services/ai-assistant.service';
import { OverviewComponent } from '../overview.component';

type AssistantSheet = 'setup' | 'test' | 'actions' | null;

@Component({
  selector: 'app-overview-mobile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  templateUrl: './overview-mobile.component.html',
  styleUrls: ['./overview-mobile.component.scss'],
  providers: [AiAssistantService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewMobileComponent extends OverviewComponent {
  protected readonly activeSheet = signal<AssistantSheet>(null);

  protected readonly primaryStats = computed(() => this.quickStats().slice(0, 4));
  protected readonly followUpStats = computed(() => this.quickStats().slice(4));

  protected openSheet(sheet: Exclude<AssistantSheet, null>): void {
    this.activeSheet.set(sheet);
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
  }

  protected conversationInitial(conversation: Conversation): string {
    return this.getConversationName(conversation).slice(0, 1).toUpperCase();
  }

  protected statusLabel(conversation: Conversation): string {
    if (conversation.status === 'escalated') {
      return 'Needs you';
    }

    if (conversation.handledBy === 'human') {
      return 'Human';
    }

    return 'AI';
  }
}
