import { AfterViewChecked, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, skip } from 'rxjs';
import { AiAssistantService, Conversation, Message } from '../../services/ai-assistant.service';
import { SocketService } from '../../services/socket.service';

type LeadTag = 'new' | 'hot' | 'interested' | 'pending' | 'paid' | 'follow_up';

@Component({
  selector: 'app-conversations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.scss'],
  providers: [AiAssistantService]
})
export class ConversationsComponent implements OnInit, AfterViewChecked {
  private aiService = inject(AiAssistantService);
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLInputElement>;

  readonly conversations = signal<Conversation[]>([]);
  readonly selectedConversation = signal<Conversation | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly newMessage = signal('');
  readonly searchQuery = signal('');
  readonly filterStatus = signal('');
  readonly filterLeadTag = signal('');
  readonly loading = signal(false);
  readonly messagesLoading = signal(false);
  readonly sending = signal(false);
  shouldScroll = false;

  leadTags: { value: LeadTag; label: string; icon: string }[] = [
    { value: 'new', label: 'New', icon: 'fiber_new' },
    { value: 'hot', label: 'Hot Lead', icon: 'local_fire_department' },
    { value: 'interested', label: 'Interested', icon: 'thumb_up' },
    { value: 'pending', label: 'Pending', icon: 'schedule' },
    { value: 'paid', label: 'Paid', icon: 'paid' },
    { value: 'follow_up', label: 'Follow Up', icon: 'notifications_active' },
  ];

  constructor() {
    toObservable(this.searchQuery)
      .pipe(skip(1), debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadConversations());
  }

  ngOnInit(): void {
    this.loadConversations();

    this.socketService.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((msg: any) => {
        const selectedConversation = this.selectedConversation();
        if (selectedConversation && msg.conversationId === selectedConversation._id) {
          this.messages.update(messages => [...messages, {
            _id: msg._id || `socket-${Date.now()}`,
            conversationId: msg.conversationId,
            direction: msg.direction,
            content: msg.content,
            source: msg.source,
            timestamp: msg.timestamp || new Date().toISOString()
          }]);
          this.shouldScroll = true;
        }
        this.loadConversations(false);
      });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadConversations(showLoader = true): void {
    if (showLoader) this.loading.set(true);
    this.aiService.getConversations(
      this.filterStatus() || undefined,
      1,
      40,
      this.searchQuery(),
      this.filterLeadTag()
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (conversations) => {
          this.conversations.set(conversations);
          this.loading.set(false);
          const selectedConversation = this.selectedConversation();
          if (selectedConversation) {
            const refreshed = conversations.find(c => c._id === selectedConversation._id);
            if (refreshed) {
              this.selectedConversation.set(refreshed);
            }
          }
          const queryId = this.route.snapshot.queryParamMap.get('id');
          if (queryId && !this.selectedConversation()) {
            const found = conversations.find(c => c._id === queryId);
            if (found) this.selectConversation(found);
          }
          if (!this.selectedConversation() && conversations.length && window.innerWidth > 760) {
            this.selectConversation(conversations[0]);
          }
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Could not load conversations', 'Close', { duration: 5000 });
        }
      });
  }

  setFilterStatus(status: string): void {
    this.filterStatus.set(status);
    this.loadConversations();
  }

  setFilterLeadTag(leadTag: string): void {
    this.filterLeadTag.set(leadTag);
    this.loadConversations();
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation.set(conversation);
    this.messagesLoading.set(true);
    this.socketService.joinConversation(conversation._id);
    this.aiService.getMessages(conversation._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (messages) => {
          this.messages.set(messages);
          this.messagesLoading.set(false);
          this.shouldScroll = true;
          setTimeout(() => this.messageInput?.nativeElement?.focus(), 50);
        },
        error: () => {
          this.messagesLoading.set(false);
          this.snackBar.open('Could not load messages', 'Close', { duration: 5000 });
        }
      });
  }

  sendMessage(): void {
    const selectedConversation = this.selectedConversation();
    const text = this.newMessage().trim();
    if (!selectedConversation || !text) return;

    this.newMessage.set('');
    this.sending.set(true);

    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: selectedConversation._id,
      direction: 'outbound',
      content: text,
      source: 'agent',
      timestamp: new Date().toISOString()
    };
    this.messages.update(messages => [...messages, tempMessage]);
    this.shouldScroll = true;

    this.aiService.sendMessage(selectedConversation._id, text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.sending.set(false);
          this.selectedConversation.set({
            ...selectedConversation,
            handledBy: 'human',
            lastMessageText: text,
            lastMessageSource: 'agent',
            lastMessageAt: tempMessage.timestamp,
          });
          this.loadConversations(false);
        },
        error: () => {
          this.sending.set(false);
          this.messages.update(messages => messages.filter(message => message._id !== tempMessage._id));
          this.snackBar.open('Message was not sent. Check WhatsApp connection.', 'Close', { duration: 5000 });
        }
      });
  }

  takeover(): void {
    const selectedConversation = this.selectedConversation();
    if (!selectedConversation) return;

    this.aiService.takeoverConversation(selectedConversation._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.selectedConversation.set(res.data);
          this.loadConversations(false);
          this.snackBar.open('You are now handling this chat', 'Close', { duration: 3000 });
        }
      });
  }

  escalate(): void {
    const selectedConversation = this.selectedConversation();
    if (!selectedConversation) return;

    this.aiService.escalateConversation(selectedConversation._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.selectedConversation.set(res.data);
          this.loadConversations(false);
        }
      });
  }

  resolve(): void {
    const selectedConversation = this.selectedConversation();
    if (!selectedConversation) return;

    this.aiService.resolveConversation(selectedConversation._id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.selectedConversation.set(res.data);
          this.loadConversations(false);
          this.snackBar.open('Chat marked as resolved', 'Close', { duration: 3000 });
        }
      });
  }

  tagLead(leadTag: LeadTag): void {
    const selectedConversation = this.selectedConversation();
    if (!selectedConversation) return;

    this.aiService.tagConversation(selectedConversation._id, leadTag)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          this.selectedConversation.set(res.data);
          this.loadConversations(false);
        }
      });
  }

  quickAction(actionType: 'storefront' | 'payment'): void {
    const selectedConversation = this.selectedConversation();
    if (!selectedConversation) return;

    this.aiService.sendQuickAction(selectedConversation._id, actionType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(actionType === 'storefront' ? 'Store link sent' : 'Payment link sent', 'Close', { duration: 3000 });
          this.selectConversation(selectedConversation);
        },
        error: () => this.snackBar.open('Set this link in Automation before sending.', 'Close', { duration: 5000 })
      });
  }

  getName(conversation: Conversation): string {
    return conversation.customerName && conversation.customerName !== 'Customer'
      ? conversation.customerName
      : conversation.customerWaId;
  }

  getLeadLabel(value?: string): string {
    return this.leadTags.find(tag => tag.value === value)?.label || 'New';
  }

  scrollToBottom(): void {
    const element = this.scrollContainer?.nativeElement;
    if (element) element.scrollTop = element.scrollHeight;
  }
}
