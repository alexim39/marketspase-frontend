import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { AiAssistantService, Conversation, Message } from '../../../services/ai-assistant.service';
import { ConversationsComponent } from '../conversations.component';

type ConversationSheet = 'filters' | 'actions' | 'leadTag' | null;

@Component({
  selector: 'app-conversations-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './conversations-mobile.component.html',
  styleUrls: ['./conversations-mobile.component.scss'],
  providers: [AiAssistantService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConversationsMobileComponent extends ConversationsComponent {
  protected readonly activeSheet = signal<ConversationSheet>(null);

  protected readonly escalatedCount = computed(() => this.conversations().filter(chat => chat.status === 'escalated').length);
  protected readonly activeCount = computed(() => this.conversations().filter(chat => chat.status === 'active').length);
  protected readonly humanCount = computed(() => this.conversations().filter(chat => chat.handledBy === 'human').length);
  protected readonly totalUnread = computed(() => this.conversations().reduce((total, chat) => total + (chat.unreadCount || 0), 0));

  protected openSheet(sheet: Exclude<ConversationSheet, null>): void {
    this.activeSheet.set(sheet);
  }

  protected closeSheet(): void {
    this.activeSheet.set(null);
  }

  protected backToList(): void {
    this.selectedConversation.set(null);
    this.messages.set([]);
    this.newMessage.set('');
    this.closeSheet();
  }

  protected selectAndClose(conversation: Conversation): void {
    this.selectConversation(conversation);
    this.closeSheet();
  }

  protected setStatusAndClose(status: string): void {
    this.setFilterStatus(status);
    this.closeSheet();
  }

  protected setLeadAndClose(leadTag: string): void {
    this.setFilterLeadTag(leadTag);
    this.closeSheet();
  }

  protected tagLeadAndClose(leadTag: Conversation['leadTag']): void {
    this.tagLead(leadTag);
    this.closeSheet();
  }

  protected messageSourceLabel(message: Message): string {
    if (message.source === 'agent') return 'You';
    if (message.source === 'faq') return 'FAQ';
    if (message.source === 'ai') return 'AI';
    return 'Customer';
  }

  protected initials(conversation: Conversation): string {
    return this.getName(conversation).slice(0, 1).toUpperCase();
  }

  protected chatStatusLabel(conversation: Conversation): string {
    if (conversation.status === 'escalated') return 'Needs attention';
    if (conversation.status === 'resolved') return 'Resolved';
    return conversation.handledBy === 'human' ? 'Human handling' : 'AI handling';
  }
}
