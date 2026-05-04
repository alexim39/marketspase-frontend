// conversation-list.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Conversation } from '../../models/assistant.model';
import { AiAssistantService } from '../../services/ai-assistant.service';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <mat-card class="conv-list-card">
      <h3 class="card-title">Conversations</h3>
      <div *ngIf="!conversations || conversations.length === 0" class="empty-state">
        <p>No conversations yet.</p>
      </div>
      <div
        *ngFor="let conv of conversations"
        class="conv-item"
        [class.active]="conv.id === selectedId"
        (click)="select(conv.id)"
      >
        <div class="conv-details">
          <strong>{{ conv.customerName }}</strong>
          <span class="last-message">{{ conv.lastMessage }}</span>
        </div>
        <mat-icon *ngIf="conv.status === 'escalated'" color="warn" class="escalation-icon">warning</mat-icon>
      </div>
    </mat-card>
  `,
  styles: [`
    .conv-list-card {
      background: var(--surface-color);
      height: 100%;
    }
    .card-title { margin-bottom: 16px; }
    .empty-state { padding: 8px; color: var(--text-secondary); }
    .conv-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid var(--divider-color);
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .conv-item.active {
      background-color: var(--gray-50);
    }
    .conv-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .last-message {
      color: var(--text-secondary);
      font-size: 0.8rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .escalation-icon {
      flex-shrink: 0;
    }
  `]
})
export class ConversationListComponent {
  @Input() conversations: Conversation[] | null = [];
  @Input() selectedId: string | null = null;

  constructor(private service: AiAssistantService) {}

  select(id: string): void {
    this.service.selectConversation(id);
  }
}