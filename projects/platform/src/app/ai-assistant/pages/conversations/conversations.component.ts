import { Component, inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { AiAssistantService, Conversation, Message } from '../../services/ai-assistant.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatBadgeModule, MatProgressSpinnerModule, MatChipsModule,
    MatTooltipModule, FormsModule
  ],
  providers: [DatePipe],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.scss']
})
export class ConversationsComponent implements OnInit, OnDestroy, AfterViewChecked {
  private aiService = inject(AiAssistantService);
  private socketService = inject(SocketService);
  private route = inject(ActivatedRoute);
  private datePipe = inject(DatePipe);

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';
  filterStatus = '';
  loading = false;
  messagesLoading = false;
  isTyping = false;
  private sub = new Subscription();
  private shouldScroll = false;

  ngOnInit(): void {
    this.loadConversations();
    this.sub.add(
      this.socketService.messages$.subscribe((msg: any) => {
        if (this.selectedConversation && msg.conversationId === this.selectedConversation._id) {
          this.messages.push({
            _id: msg._id || 'new',
            conversationId: msg.conversationId,
            direction: msg.direction,
            content: msg.content,
            source: msg.source,
            timestamp: msg.timestamp || new Date().toISOString()
          });
          this.shouldScroll = true;
          this.isTyping = false;
        }
        this.loadConversations();
      })
    );
    this.sub.add(
      this.socketService.conversationUpdates$.subscribe((update: any) => {
        if (update.type === 'typing' && this.selectedConversation?._id === update.conversationId) {
          this.isTyping = true;
          setTimeout(() => this.isTyping = false, 2000);
        }
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  loadConversations(): void {
    this.loading = true;
    this.aiService.getConversations(this.filterStatus || undefined).subscribe({
      next: (convs) => {
        this.conversations = convs;
        this.loading = false;
        const queryId = this.route.snapshot.queryParamMap.get('id');
        if (queryId && !this.selectedConversation) {
          const found = convs.find(c => c._id === queryId);
          if (found) this.selectConversation(found);
        }
      },
      error: () => this.loading = false
    });
  }

  selectConversation(conv: Conversation): void {
    this.selectedConversation = conv;
    this.messagesLoading = true;
    this.socketService.joinConversation(conv._id);
    this.aiService.getMessages(conv._id).subscribe({
      next: (msgs) => {
        this.messages = msgs;
        this.messagesLoading = false;
        this.shouldScroll = true;
        setTimeout(() => this.messageInput?.nativeElement?.focus(), 100);
      },
      error: () => this.messagesLoading = false
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation) return;
    const text = this.newMessage.trim();
    this.newMessage = '';
    
    const tempMsg: Message = {
      _id: 'temp-' + Date.now(),
      conversationId: this.selectedConversation._id,
      direction: 'outbound',
      content: text,
      source: 'agent',
      timestamp: new Date().toISOString()
    };
    this.messages.push(tempMsg);
    this.shouldScroll = true;

    this.aiService.sendMessage(this.selectedConversation._id, text).subscribe({
      next: () => this.loadConversations(),
      error: () => {
        this.messages = this.messages.filter(m => m._id !== tempMsg._id);
      }
    });
  }

  escalate(): void {
    if (!this.selectedConversation) return;
    this.aiService.escalateConversation(this.selectedConversation._id).subscribe({
      next: () => {
        this.selectedConversation!.status = 'escalated';
        this.loadConversations();
      }
    });
  }

  resolve(): void {
    if (!this.selectedConversation) return;
    this.selectedConversation.status = 'resolved';
  }

  formatTime(timestamp: string): string {
    return this.datePipe.transform(timestamp, 'shortTime') || '';
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    return this.datePipe.transform(timestamp, 'MMM d') || '';
  }

  scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  getStatusIcon(status: string): string { return status === 'escalated' ? 'warning' : 'chat'; }
  getStatusColor(status: string): string { return status === 'escalated' ? 'warn' : 'primary'; }
}