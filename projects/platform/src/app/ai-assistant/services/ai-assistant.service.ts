import { inject, Injectable, Signal } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Conversation, FAQ, Stats, AiSettings, Message, AutomationSettings, AnalyticsData } from '../models/assistant.model';
import { UserService } from '../../common/services/user.service.js';
import { UserInterface } from '@shared/services';
import { AiAssistantApiService } from './ai-assistant-api.service';

@Injectable()
export class AiAssistantService {
  private aiEnabled = new BehaviorSubject<boolean>(false);
  aiEnabled$ = this.aiEnabled.asObservable();

  private userService: UserService = inject(UserService);
  public user: Signal<UserInterface | null> = this.userService.user;

  private stats = new BehaviorSubject<Stats>({
    totalMessages: 0,
    aiHandled: 0,
    responseTime: 0,
  });
  stats$ = this.stats.asObservable();

  private faqs = new BehaviorSubject<FAQ[]>([]);
  faqs$ = this.faqs.asObservable();

  private conversations = new BehaviorSubject<Conversation[]>([]);
  conversations$ = this.conversations.asObservable();

  private selectedConversationId = new BehaviorSubject<string | null>(null);
  selectedConversationId$ = this.selectedConversationId.asObservable();

  private settings = new BehaviorSubject<AiSettings>({
    tone: 'friendly',
    language: 'english',
  });
  settings$ = this.settings.asObservable();

  private loading = new BehaviorSubject<boolean>(false);
  loading$ = this.loading.asObservable();

  constructor(private api: AiAssistantApiService) {}

  // ---------- Initialisation ----------
  loadInitialData(): void {
    this.loading.next(true);
    forkJoin([
      this.api.getStats(this.user()?._id ?? ''),
      this.api.getFaqs(this.user()?._id ?? ''),
      this.api.getConversations(this.user()?._id ?? ''),
      this.api.getSettings(this.user()?._id ?? ''),
    ])
      .pipe(
        tap(([stats, faqs, conversations, settings]) => {
          this.stats.next(stats);
          this.faqs.next(faqs);
          this.conversations.next(conversations);
          this.settings.next(settings);
        }),
        catchError(err => {
          console.error('Failed to load initial data', err);
          return of(null);
        }),
        finalize(() => this.loading.next(false))
      )
      .subscribe();
  }

  // ---------- FAQ CRUD ----------
  addFAQ(question: string, answer: string): void {
    this.api.addFaq(this.user()?._id ?? '', question, answer).pipe(
      tap(newFaq => {
        const current = this.faqs.value;
        this.faqs.next([...current, newFaq]);
      })
    ).subscribe();
  }

  updateFAQ(id: string, updates: Partial<FAQ>): void {
    this.api.updateFaq(id, updates).pipe(
      tap(updatedFaq => {
        const current = this.faqs.value;
        const index = current.findIndex(f => f.id === id);
        if (index !== -1) {
          const newFaqs = [...current];
          newFaqs[index] = updatedFaq;
          this.faqs.next(newFaqs);
        }
      })
    ).subscribe();
  }

  deleteFAQ(id: string): void {
    this.api.deleteFaq(id).pipe(
      tap(() => {
        this.faqs.next(this.faqs.value.filter(f => f.id !== id));
      })
    ).subscribe();
  }

  // ---------- Conversations ----------
  selectConversation(id: string): void {
    this.selectedConversationId.next(id);
    // Load messages for this conversation if not already loaded
    const conv = this.conversations.value.find(c => c.id === id);
    if (conv && conv.messages.length === 0) {
      this.api.getMessages(id).pipe(
        tap(messages => {
          const updated = this.conversations.value.map(c =>
            c.id === id ? { ...c, messages } : c
          );
          this.conversations.next(updated);
        })
      ).subscribe();
    }
  }

  sendMessage(text: string): void {
    const convId = this.selectedConversationId.value;
    if (!convId) return;

    this.api.sendMessage(convId, text).pipe(
      tap(() => {
        // Add the sent message locally for immediate feedback
        const newMsg: Message = {
          id: '', // temporary
          sender: 'agent',
          text,
          timestamp: new Date(),
        };
        const convs = this.conversations.value.map(c =>
          c.id === convId ? {
            ...c,
            lastMessage: text,
            messages: [...c.messages, newMsg],
          } : c
        );
        this.conversations.next(convs);

        // Refresh the conversation list to get the bot's possible response
        this.refreshConversations();
      })
    ).subscribe();
  }

  takeOverConversation(id: string): void {
    this.api.escalateConversation(id).pipe(
      tap(updatedConv => {
        const convs = this.conversations.value.map(c =>
          c.id === id ? updatedConv : c
        );
        this.conversations.next(convs);
      })
    ).subscribe();
  }

  // Refresh full conversation list from server
  private refreshConversations(): void {
    this.api.getConversations(this.user()?._id ?? '').pipe(
      tap(convs => {
        this.conversations.next(convs);
        // Re-select current conversation to reload its messages
        if (this.selectedConversationId.value) {
          this.selectConversation(this.selectedConversationId.value);
        }
      })
    ).subscribe();
  }

  // ---------- Settings ----------
  updateSettings(settings: Partial<AiSettings>): void {
    this.settings.next({ ...this.settings.value, ...settings });
    this.api.updateSettings(this.user()?._id ?? '', settings).subscribe();
  }

  toggleAI(enable: boolean): void {
    this.aiEnabled.next(enable);
    this.api.toggleAI(enable).subscribe();
  }


  // Automation
private automationSettings = new BehaviorSubject<AutomationSettings>({
  tone: 'friendly',
  language: 'english',
  escalateOnKeywords: true,
  escalateKeywords: 'refund,complaint',
  lowConfidenceFallback: true,
  autoReplyEnabled: true,
});
automationSettings$ = this.automationSettings.asObservable();

// Analytics
private analytics = new BehaviorSubject<AnalyticsData | null>(null);
analytics$ = this.analytics.asObservable();

// Methods
loadAutomationSettings(): void {
  this.loading.next(true);
  this.api.getAutomationSettings(this.user()?._id ?? '').pipe(
    tap(settings => this.automationSettings.next(settings)),
    finalize(() => this.loading.next(false))
  ).subscribe();
}

updateAutomationSettings(settings: Partial<AutomationSettings>): void {
  this.api.updateAutomationSettings(this.user()?._id ?? '', settings).pipe(
    tap(updated => this.automationSettings.next({ ...this.automationSettings.value, ...updated }))
  ).subscribe();
}

loadAnalytics(): void {
  this.loading.next(true);
  this.api.getAnalytics(this.user()?._id ?? '').pipe(
    tap(data => this.analytics.next(data)),
    finalize(() => this.loading.next(false))
  ).subscribe();
}

}