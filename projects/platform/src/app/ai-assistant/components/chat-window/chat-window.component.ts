/* // chat-window.component.ts
import { Component, Input, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // for the input binding (not a reactive form here, simple enough)
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Conversation, Message } from '../../models/assistant.model';
import { AiAssistantService } from '../../services/ai-assistant.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <mat-card class="chat-card" *ngIf="conversation; else noChat">
      <div class="chat-header">
        <h3>{{ conversation.customerName }}</h3>
        <div class="actions">
          <button
            *ngIf="conversation.status !== 'escalated'"
            mat-stroked-button
            color="warn"
            (click)="takeOver()">
            Take Over Chat
          </button>
          <span *ngIf="conversation.status === 'escalated'" class="escalated-badge">Escalated</span>
        </div>
      </div>
      <div class="messages-container" #messagesContainer>
        <div *ngFor="let msg of conversation.messages" class="message-row">
          <div class="message-bubble" [ngClass]="msg.sender">
            {{ msg.text }}
            <div class="time">{{ msg.timestamp | date:'shortTime' }}</div>
          </div>
        </div>
      </div>
      <div class="chat-input-row">
        <mat-form-field appearance="outline" class="full-width-input">
          <input matInput
                 [(ngModel)]="newMessage"
                 placeholder="Type a reply..."
                 (keyup.enter)="send()">
        </mat-form-field>
        <button mat-fab color="primary" (click)="send()" [disabled]="!newMessage.trim()">
          <mat-icon>send</mat-icon>
        </button>
      </div>
    </mat-card>
    <ng-template #noChat>
      <mat-card class="no-conversation">
        <p>Select a conversation to view messages</p>
      </mat-card>
    </ng-template>
  `,
  styles: [`
    .chat-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--surface-color);
    }
    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--divider-color);
    }
    .escalated-badge {
      background: var(--warning-color);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .message-row {
      display: flex;
      flex-direction: column;
    }
    .message-bubble {
      max-width: 75%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 0.9rem;
      position: relative;
    }
    .message-bubble.customer {
      background: var(--gray-100);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .message-bubble.ai,
    .message-bubble.agent {
      background: var(--primary-color);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .time {
      font-size: 0.7rem;
      opacity: 0.7;
      margin-top: 4px;
      text-align: right;
    }
    .chat-input-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 0 0;
    }
    .full-width-input {
      flex: 1;
    }
    .no-conversation {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-secondary);
      background: var(--surface-color);
    }
  `]
})
export class ChatWindowComponent implements AfterViewChecked {
  @Input() conversation: Conversation | undefined;
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  newMessage = '';

  constructor(private service: AiAssistantService) {}

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  send(): void {
    if (this.newMessage.trim() && this.conversation) {
      this.service.sendMessage(this.newMessage.trim());
      this.newMessage = '';
    }
  }

  takeOver(): void {
    if (this.conversation) {
      this.service.takeOverConversation(this.conversation.id);
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
} */