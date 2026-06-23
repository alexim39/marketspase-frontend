import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CollaborationService, DashboardConversation } from '../../../../campaign/collaboration/collaboration.service';
import { interval, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'collab-chat-widget',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    <section class="chat-widget" aria-label="Recent messages">
      <div class="widget-head">
        <div>
          <span class="widget-kicker">Messages</span>
          <h3>Recent conversations</h3>
        </div>
        <a routerLink="/dashboard/campaigns/collaboration" class="view-all">View all</a>
      </div>

      @if (loading()) {
        <div class="widget-loading">
          <span class="pulse"></span>
          <span class="pulse"></span>
          <span class="pulse"></span>
        </div>
      } @else if (conversations().length === 0) {
        <div class="widget-empty">
          <mat-icon>chat_bubble_outline</mat-icon>
          <p>No messages yet. Open a campaign room to start collaborating.</p>
        </div>
      } @else {
        <div class="chat-list">
          @for (conv of conversations(); track conv._id) {
            <a
              class="chat-item"
              [class.unread]="conv.isUnread"
              [routerLink]="['/dashboard/campaigns/collaboration']"
              [queryParams]="{ conversationId: conv._id }"
            >
              <div class="chat-avatar">
                @if (conv.lastMessageBy?.avatar) {
                  <img [src]="conv.lastMessageBy!.avatar" alt="" />
                } @else {
                  <span>{{ (conv.lastMessageBy?.displayName || '?')[0] }}</span>
                }
              </div>
              <div class="chat-body">
                <div class="chat-header">
                  <strong>{{ conv.title }}</strong>
                  @if (conv.isUnread) {
                    <span class="unread-dot"></span>
                  }
                  <span class="chat-time">{{ formatChatTime(conv.lastMessageAt) }}</span>
                </div>
                <p class="chat-preview">{{ conv.lastMessagePreview || 'No messages yet' }}</p>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    :host { display: block; }

    .chat-widget {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      overflow: hidden;
    }

    .widget-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1rem 1.15rem 0.5rem;

      h3 { margin: 0; font-size: 1rem; color: var(--text-primary); }
    }

    .widget-kicker {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--primary-color);
    }

    .view-all {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--primary-color);
      text-decoration: none;
    }

    .widget-loading {
      display: flex;
      gap: 4px;
      padding: 1rem 1.15rem;
      justify-content: center;

      .pulse {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: var(--primary-color);
        opacity: 0.3;
        animation: pulse 1.2s infinite ease-in-out;
        &:nth-child(2) { animation-delay: 0.2s; }
        &:nth-child(3) { animation-delay: 0.4s; }
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.4); }
    }

    .widget-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      padding: 1.5rem 1rem;
      text-align: center;
      color: var(--text-secondary);
      font-size: 0.82rem;

      mat-icon { font-size: 28px; width: 28px; height: 28px; opacity: 0.5; }
    }

    .chat-list {
      display: flex;
      flex-direction: column;
    }

    .chat-item {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1.15rem;
      text-decoration: none;
      color: inherit;
      transition: background 0.15s;
      border-top: 1px solid var(--border-color);

      &:hover { background: rgba(var(--primary-rgb), 0.03); }

      &.unread {
        background: rgba(var(--primary-rgb), 0.04);
      }
    }

    .chat-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(var(--primary-rgb), 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--primary-color);

      img {
        width: 100%; height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }
    }

    .chat-body {
      flex: 1;
      min-width: 0;
    }

    .chat-header {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-bottom: 0.2rem;

      strong {
        font-size: 0.85rem;
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        flex: 1;
      }
    }

    .unread-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      flex-shrink: 0;
    }

    .chat-time {
      font-size: 0.7rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .chat-preview {
      margin: 0;
      font-size: 0.78rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `],
})
export class CollabChatWidgetComponent {
  private readonly collaborationService = inject(CollaborationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly conversations = signal<DashboardConversation[]>([]);

  constructor() {
    interval(60000)
      .pipe(
        startWith(0),
        switchMap(() => this.collaborationService.getDashboardConversations()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.conversations.set(res?.data?.conversations || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  formatChatTime(date: string | Date): string {
    if (!date) return '';
    const diffMs = Date.now() - new Date(date).getTime();
    if (diffMs < 60000) return 'now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h`;
    return `${Math.floor(diffMs / 86400000)}d`;
  }
}
