import { Component, inject, signal, viewChild, ElementRef, afterNextRender, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '@shared/services';
import { UserService } from '../../services/user.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

import { DeviceService } from '@shared/services/device';

const ALWAYS_HIDDEN = ['messages', 'campaigns/create', 'campaigns/edit', 'stores/support'];
const MOBILE_HIDDEN = ['/home'];

@Component({
  selector: 'app-marketai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './marketai-chat.component.html',
  styleUrls: ['./marketai-chat.component.scss'],
})
export class MarketAiChatComponent {
  private api = inject(ApiService);
  private userService = inject(UserService);
  private router = inject(Router);
  private deviceService = inject(DeviceService);

  readonly hidden = signal(this.isHiddenRoute(this.router.url));
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly messages = signal<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I\'m MarketAI — your MarketSpase assistant. Ask me about campaigns, wallet, promotions, or your storefront.' },
  ]);
  readonly inputText = signal('');
  private chatBodyEl = viewChild<ElementRef>('chatBody');

  private readonly usageLimits: Record<string, number> = {
    admin: 200,
    marketer: 50,
    marketing_rep: 50,
    promoter: 10,
  };

  readonly usageLimit = computed(() => {
    const role = this.userService.user()?.role;
    return role ? (this.usageLimits[role] ?? 10) : 10;
  });

  readonly usageRemaining = computed(() => Math.max(0, this.usageLimit() - this.sentCount()));
  readonly usagePercent = computed(() => this.usageLimit() ? (this.sentCount() / this.usageLimit()) * 100 : 0);
  readonly usageBarWidth = computed(() => Math.min(100, Math.max(0, 100 - this.usagePercent())));

  readonly sentCount = signal(this.loadDailyCount());

  private storageKey(): string {
    return `marketai_usage_${new Date().toISOString().split('T')[0]}`;
  }

  private isHiddenRoute(url: string): boolean {
    if (ALWAYS_HIDDEN.some(r => url.includes(r))) return true;
    if (this.deviceService.isMobile() && MOBILE_HIDDEN.some(r => url.includes(r))) return true;
    return false;
  }

  private loadDailyCount(): number {
    const key = this.storageKey();
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) || 0 : 0;
  }

  private saveDailyCount(): void {
    localStorage.setItem(this.storageKey(), String(this.sentCount()));
  }

  constructor() {
    this.router.events.pipe(filter((e: any) => e instanceof NavigationEnd)).subscribe(() => {
      this.hidden.set(this.isHiddenRoute(this.router.url));
    });
    const today = new Date().toISOString().split('T')[0];
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('marketai_usage_') && key !== this.storageKey()) {
        localStorage.removeItem(key);
      }
    }
    afterNextRender(() => this.scrollToBottom());
  }

  toggle(): void { this.open.update(v => !v); if (this.open()) setTimeout(() => this.scrollToBottom(), 100); }

  async send(): Promise<void> {
    const text = this.inputText().trim();
    if (!text || this.loading()) return;
    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.inputText.set('');
    this.loading.set(true);
    this.sentCount.update(c => c + 1);
    this.saveDailyCount();
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
