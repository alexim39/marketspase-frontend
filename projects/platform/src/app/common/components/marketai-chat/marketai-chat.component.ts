import { Component, inject, signal, viewChild, ElementRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@shared/services';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

@Component({
  selector: 'app-marketai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './marketai-chat.component.html',
  styleUrls: ['./marketai-chat.component.scss'],
})
export class MarketAiChatComponent {
  private api = inject(ApiService);

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly messages = signal<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m MarketAI — your MarketSpase assistant. Ask me about campaigns, wallet, promotions, or your storefront.' },
  ]);
  readonly inputText = signal('');
  private chatBodyEl = viewChild<ElementRef>('chatBody');

  constructor() { afterNextRender(() => this.scrollToBottom()); }

  toggle(): void { this.open.update(v => !v); if (this.open()) setTimeout(() => this.scrollToBottom(), 100); }

  async send(): Promise<void> {
    const text = this.inputText().trim();
    if (!text || this.loading()) return;
    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.inputText.set('');
    this.loading.set(true);
    setTimeout(() => this.scrollToBottom(), 50);

    this.api.post<any>('api/v1/marketai/message', {
      message: text,
      history: this.messages().slice(-10).map(m => ({ role: m.role, content: m.content })),
    }, undefined, true).subscribe({
      next: (r) => {
        this.messages.update(m => [...m, { role: 'assistant', content: r?.data?.reply || 'Sorry, I couldn\'t process that.' }]);
        this.loading.set(false); setTimeout(() => this.scrollToBottom(), 50);
      },
      error: (e) => {
        this.messages.update(m => [...m, { role: 'assistant', content: e?.error?.message || 'MarketAI is temporarily unavailable. Try again shortly.' }]);
        this.loading.set(false); setTimeout(() => this.scrollToBottom(), 50);
      },
    });
  }

  scrollToBottom(): void { const el = this.chatBodyEl()?.nativeElement; if (el) el.scrollTop = el.scrollHeight; }
}
