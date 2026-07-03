import { Component, inject, signal, Input, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '@shared/services/api';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-storefront-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button class="chat-trigger" [class.open]="panelOpen()" (click)="togglePanel()" [attr.aria-label]="panelOpen() ? 'Close chat' : 'Chat with us'">
  @if (panelOpen()) { <mat-icon>close</mat-icon> } @else { <mat-icon>chat</mat-icon> }
</button>

@if (panelOpen()) {
  <div class="chat-panel">
          <header class="chat-header">
            <mat-icon>support_agent</mat-icon>
            <div><strong>{{ storeName }} Support</strong><small>We typically reply instantly</small></div>
          </header>

          <div class="chat-body" #chatBody>
            @if (loading()) {
              <div class="intro-msg"><mat-spinner diameter="22" /><span>Connecting...</span></div>
            } @else if (messages().length === 0) {
              <div class="intro-msg">{{ greeting() }}</div>
            }

            @for (m of messages(); track $index) {
              <div class="msg" [class.user]="m.role === 'user'" [class.assistant]="m.role === 'assistant'">
                <div class="bubble">{{ m.content }}</div>
              </div>
            }

            @if (sending()) {
              <div class="msg assistant"><div class="bubble typing"><span></span><span></span><span></span></div></div>
            }
          </div>

          <footer class="chat-input">
            <input type="text" [ngModel]="draft()" (ngModelChange)="draft.set($event)" (keydown.enter)="send()"
              placeholder="Ask about products, prices, delivery..." [disabled]="sending()" maxlength="500" />
            <button mat-icon-button (click)="send()" [disabled]="!draft().trim() || sending()">
              <mat-icon>send</mat-icon>
            </button>
          </footer>
        </div>
      }
  `,
  styles: [`
    :host { display: block; }
    .chat-trigger {
      position: fixed; bottom: 1.5rem; right: 5.5rem; z-index: 1110;
      width: 3rem; height: 3rem; border-radius: 50%; border: none; cursor: pointer;
      background: var(--primary-color); color: #fff;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.25);
      &.open { background: var(--error-color); }
    }
    .chat-panel {
      position: fixed; bottom: 5rem; right: 5.5rem; z-index: 1109;
      width: 340px; max-height: 440px; border-radius: 16px; overflow: hidden;
      display: flex; flex-direction: column;
      background: var(--surface-color); border: 1px solid var(--border-color);
      box-shadow: 0 8px 40px rgba(0,0,0,0.2);
    }
    .chat-header {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 0.85rem;
      background: var(--primary-color); color: #fff; flex-shrink: 0;
      strong { font-size: 0.85rem; display: block; }
      small { font-size: 0.68rem; opacity: 0.8; display: block; }
    }
    .chat-body {
      flex: 1; overflow-y: auto; padding: 0.65rem; display: flex; flex-direction: column; gap: 0.5rem;
      max-height: 280px;
    }
    .intro-msg { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; font-size: 0.82rem; color: var(--text-secondary); justify-content: center; }
    .msg { display: flex; &.user { justify-content: flex-end; } &.assistant { justify-content: flex-start; } }
    .bubble {
      max-width: 85%; padding: 0.55rem 0.75rem; border-radius: 12px; font-size: 0.82rem; line-height: 1.4;
      .user & { background: var(--primary-color); color: #fff; border-bottom-right-radius: 4px; }
      .assistant & { background: rgba(var(--primary-rgb), 0.08); color: var(--text-primary); border-bottom-left-radius: 4px; }
    }
    .typing { display: flex; gap: 3px; align-items: center; padding: 0.65rem 0.85rem; }
    .typing span { width: 5px; height: 5px; border-radius: 50%; background: var(--text-secondary); animation: bounce 1.2s infinite; }
    .typing span:nth-child(2) { animation-delay: 0.15s; }
    .typing span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }
    .chat-input {
      display: flex; align-items: center; gap: 0.25rem; padding: 0.45rem 0.6rem; border-top: 1px solid var(--border-color); flex-shrink: 0;
      input { flex: 1; border: none; outline: none; font-size: 0.82rem; background: transparent; color: var(--text-primary); &::placeholder { color: var(--text-secondary); } }
    }
    @media (max-width: 480px) {
      .chat-trigger { bottom: 5rem; right: 0.5rem; }
      .chat-panel { width: calc(100vw - 1rem); right: 0.5rem; max-height: 50vh; bottom: 8.5rem; }
    }
  `],
})
export class StorefrontChatComponent {
  private http = inject(HttpClient);
  private api = inject(ApiService);
  @Input() storeLink = '';
  @Input() storeName = '';

  readonly panelOpen = signal(false);
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly draft = signal('');
  readonly messages = signal<Array<{ role: string; content: string }>>([]);
  readonly sessionId = signal(localStorage.getItem('storefront_chat_sid') || '');

  private chatBodyEl = viewChild<ElementRef>('chatBody');

  greeting() {
    return `Hi! Ask me anything about ${this.storeName || 'our products'}. I'm here to help!`;
  }

  constructor() {
    afterNextRender(() => {
      if (!this.sessionId()) {
        const sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.sessionId.set(sid);
        localStorage.setItem('storefront_chat_sid', sid);
      }
      this.loading.set(false);
    });
  }

  togglePanel(): void { this.panelOpen.update(v => !v); }

  async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.sending()) return;

    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.draft.set('');
    this.sending.set(true);
    this.scrollToBottom();

    try {
      const r = await firstValueFrom(this.api.post<{ success: boolean; data: { reply: string; sessionId: string } }>(
        'api/v1/stores/storefront/chat',
        { storeLink: this.storeLink, message: text, sessionId: this.sessionId() },
      ));
      if (r?.data?.reply) {
        this.messages.update(m => [...m, { role: 'assistant', content: r.data.reply }]);
      }
      if (r?.data?.sessionId) this.sessionId.set(r.data.sessionId);
    } catch {
      this.messages.update(m => [...m, { role: 'assistant', content: 'Sorry, I\'m having trouble right now. Please try again shortly.' }]);
    } finally {
      this.sending.set(false);
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const el = this.chatBodyEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
