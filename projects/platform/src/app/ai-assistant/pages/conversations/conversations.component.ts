import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
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
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AiAssistantService, Conversation, Message } from '../../services/ai-assistant.service';
import { SocketService } from '../../services/socket.service';

type LeadTag = 'new' | 'hot' | 'interested' | 'pending' | 'paid' | 'follow_up';

@Component({
  selector: 'app-conversations',
  standalone: true,
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
export class ConversationsComponent implements OnInit, OnDestroy, AfterViewChecked {
  private aiService = inject(AiAssistantService);
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();
  private search$ = new Subject<void>();

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLInputElement>;

  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';
  searchQuery = '';
  filterStatus = '';
  filterLeadTag = '';
  loading = false;
  messagesLoading = false;
  sending = false;
  shouldScroll = false;

  leadTags: { value: LeadTag; label: string; icon: string }[] = [
    { value: 'new', label: 'New', icon: 'fiber_new' },
    { value: 'hot', label: 'Hot Lead', icon: 'local_fire_department' },
    { value: 'interested', label: 'Interested', icon: 'thumb_up' },
    { value: 'pending', label: 'Pending', icon: 'schedule' },
    { value: 'paid', label: 'Paid', icon: 'paid' },
    { value: 'follow_up', label: 'Follow Up', icon: 'notifications_active' },
  ];

  ngOnInit(): void {
    this.search$.pipe(debounceTime(250), takeUntil(this.destroy$)).subscribe(() => this.loadConversations());
    this.loadConversations();

    this.socketService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((msg: any) => {
        if (this.selectedConversation && msg.conversationId === this.selectedConversation._id) {
          this.messages.push({
            _id: msg._id || `socket-${Date.now()}`,
            conversationId: msg.conversationId,
            direction: msg.direction,
            content: msg.content,
            source: msg.source,
            timestamp: msg.timestamp || new Date().toISOString()
          });
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadConversations(showLoader = true): void {
    if (showLoader) this.loading = true;
    this.aiService.getConversations(this.filterStatus || undefined, 1, 40, this.searchQuery, this.filterLeadTag)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversations) => {
          this.conversations = conversations;
          this.loading = false;
          if (this.selectedConversation) {
            const refreshed = conversations.find(c => c._id === this.selectedConversation?._id);
            if (refreshed) {
              this.selectedConversation = refreshed;
            }
          }
          const queryId = this.route.snapshot.queryParamMap.get('id');
          if (queryId && !this.selectedConversation) {
            const found = conversations.find(c => c._id === queryId);
            if (found) this.selectConversation(found);
          }
          if (!this.selectedConversation && conversations.length && window.innerWidth > 760) {
            this.selectConversation(conversations[0]);
          }
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Could not load conversations', 'Close', { duration: 5000 });
        }
      });
  }

  onSearchChange(): void {
    this.search$.next();
  }

  selectConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.messagesLoading = true;
    this.socketService.joinConversation(conversation._id);
    this.aiService.getMessages(conversation._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.messagesLoading = false;
          this.shouldScroll = true;
          setTimeout(() => this.messageInput?.nativeElement?.focus(), 50);
        },
        error: () => {
          this.messagesLoading = false;
          this.snackBar.open('Could not load messages', 'Close', { duration: 5000 });
        }
      });
  }

  sendMessage(): void {
    if (!this.selectedConversation || !this.newMessage.trim()) return;
    const text = this.newMessage.trim();
    this.newMessage = '';
    this.sending = true;

    const tempMessage: Message = {
      _id: `temp-${Date.now()}`,
      conversationId: this.selectedConversation._id,
      direction: 'outbound',
      content: text,
      source: 'agent',
      timestamp: new Date().toISOString()
    };
    this.messages.push(tempMessage);
    this.shouldScroll = true;

    this.aiService.sendMessage(this.selectedConversation._id, text)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.sending = false;
          this.selectedConversation = {
            ...this.selectedConversation!,
            handledBy: 'human',
            lastMessageText: text,
            lastMessageSource: 'agent',
            lastMessageAt: tempMessage.timestamp,
          };
          this.loadConversations(false);
        },
        error: () => {
          this.sending = false;
          this.messages = this.messages.filter(message => message._id !== tempMessage._id);
          this.snackBar.open('Message was not sent. Check WhatsApp connection.', 'Close', { duration: 5000 });
        }
      });
  }

  takeover(): void {
    if (!this.selectedConversation) return;
    this.aiService.takeoverConversation(this.selectedConversation._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.selectedConversation = res.data;
          this.loadConversations(false);
          this.snackBar.open('You are now handling this chat', 'Close', { duration: 3000 });
        }
      });
  }

  escalate(): void {
    if (!this.selectedConversation) return;
    this.aiService.escalateConversation(this.selectedConversation._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.selectedConversation = res.data;
          this.loadConversations(false);
        }
      });
  }

  resolve(): void {
    if (!this.selectedConversation) return;
    this.aiService.resolveConversation(this.selectedConversation._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.selectedConversation = res.data;
          this.loadConversations(false);
          this.snackBar.open('Chat marked as resolved', 'Close', { duration: 3000 });
        }
      });
  }

  tagLead(leadTag: LeadTag): void {
    if (!this.selectedConversation) return;
    this.aiService.tagConversation(this.selectedConversation._id, leadTag)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.selectedConversation = res.data;
          this.loadConversations(false);
        }
      });
  }

  quickAction(actionType: 'storefront' | 'payment'): void {
    if (!this.selectedConversation) return;
    this.aiService.sendQuickAction(this.selectedConversation._id, actionType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(actionType === 'storefront' ? 'Store link sent' : 'Payment link sent', 'Close', { duration: 3000 });
          this.selectConversation(this.selectedConversation!);
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
