import { Injectable, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, throwError } from 'rxjs';
import { filter, map, switchMap, take, timeout } from 'rxjs/operators';
import { ApiService } from '@shared/services/api';
import { UserService } from '../../common/services/user.service';

export interface Conversation {
  _id: string;
  customerWaId: string;
  customerName: string;
  status: 'active' | 'escalated' | 'resolved';
  handledBy: 'ai' | 'human';
  leadTag: 'new' | 'hot' | 'interested' | 'pending' | 'paid' | 'follow_up';
  priority?: 'normal' | 'high';
  unreadCount?: number;
  escalationReason?: string;
  lastMessageText: string;
  lastMessageAt: string;
  lastMessageSource?: 'customer' | 'ai' | 'faq' | 'agent';
  assignedTo?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  source: 'customer' | 'ai' | 'faq' | 'agent';
  timestamp: string;
}

export interface Template {
  _id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
}

@Injectable()
export class AiAssistantService {
  private apiService: ApiService = inject(ApiService);
  private userService: UserService = inject(UserService);
  private baseUrl = 'api/v1/ai-assistant';
  private user$ = toObservable(this.userService.user);

  private withUser<T>(request: (userId: string) => Observable<T>): Observable<T> {
    const currentUserId = this.userService.user()?._id;
    if (currentUserId) {
      return request(currentUserId);
    }

    return this.user$.pipe(
      map(user => user?._id || ''),
      filter((userId): userId is string => !!userId),
      take(1),
      timeout({
        first: 15000,
        with: () => throwError(() => new Error('User session is not ready')),
      }),
      switchMap(request)
    );
  }

  private withUserId(url: string, userId: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}userId=${encodeURIComponent(userId)}`;
  }

  getStats(): Observable<any> {
    return this.withUser(userId => this.apiService.get(this.withUserId(`${this.baseUrl}/stats`, userId)));
  }

  getAnalytics(): Observable<any> {
    return this.withUser(userId => this.apiService.get(this.withUserId(`${this.baseUrl}/analytics`, userId)));
  }

  getConversations(status?: string, page = 1, limit = 20, search = '', leadTag = ''): Observable<Conversation[]> {
    let url = `${this.baseUrl}/conversations?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (leadTag) url += `&leadTag=${encodeURIComponent(leadTag)}`;
    return this.withUser(userId => this.apiService.get<any>(this.withUserId(url, userId))).pipe(map(res => res.data));
  }

  getMessages(conversationId: string, page = 1, limit = 50): Observable<Message[]> {
    return this.withUser(userId =>
      this.apiService.get<any>(this.withUserId(`${this.baseUrl}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`, userId))
    ).pipe(map(res => res.data));
  }

  sendMessage(conversationId: string, text: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/messages`, { text, userId })
    );
  }

  escalateConversation(conversationId: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/escalate`, { userId })
    );
  }

  assignConversation(conversationId: string, assigneeId: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/assign`, { assigneeId, userId })
    );
  }

  takeoverConversation(conversationId: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/takeover`, { userId })
    );
  }

  resolveConversation(conversationId: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/resolve`, { userId })
    );
  }

  tagConversation(conversationId: string, leadTag: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/tag`, { userId, leadTag })
    );
  }

  sendQuickAction(conversationId: string, actionType: string, payload: any = {}): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/quick-action`, {
        userId,
        actionType,
        payload,
      })
    );
  }

  testAssistant(message: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/test`, { userId, message })
    );
  }

  getFaqs(): Observable<any[]> {
    return this.withUser(userId => this.apiService.get<any>(this.withUserId(`${this.baseUrl}/faqs`, userId))).pipe(map(res => res.data));
  }

  addFaq(data: { question: string; answer: string; category?: string; tags?: string[] }): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/faqs`, { ...data, userId })
    );
  }

  updateFaq(id: string, data: any): Observable<any> {
    return this.withUser(userId =>
      this.apiService.put(`${this.baseUrl}/faqs/${id}`, { ...data, userId })
    );
  }

  deleteFaq(id: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.delete(this.withUserId(`${this.baseUrl}/faqs/${id}`, userId))
    );
  }

  getTemplates(): Observable<Template[]> {
    return this.withUser(userId => this.apiService.get<any>(this.withUserId(`${this.baseUrl}/templates`, userId))).pipe(map(res => res.data));
  }

  addTemplate(data: Partial<Template>): Observable<any> {
    return this.withUser(userId =>
      this.apiService.post(`${this.baseUrl}/templates`, { ...data, userId })
    );
  }

  updateTemplate(id: string, data: Partial<Template>): Observable<any> {
    return this.withUser(userId =>
      this.apiService.put(`${this.baseUrl}/templates/${id}`, { ...data, userId })
    );
  }

  deleteTemplate(id: string): Observable<any> {
    return this.withUser(userId =>
      this.apiService.delete(this.withUserId(`${this.baseUrl}/templates/${id}`, userId))
    );
  }

  getSettings(): Observable<any> {
    return this.withUser(userId => this.apiService.get(this.withUserId(`${this.baseUrl}/settings`, userId)));
  }

  updateSettings(data: any): Observable<any> {
    return this.withUser(userId =>
      this.apiService.put(`${this.baseUrl}/settings`, { ...data, userId })
    );
  }

  toggleAI(enabled: boolean, userId?: string): Observable<any> {
    if (userId) {
      return this.apiService.post(`${this.baseUrl}/toggle`, { aiEnabled: enabled, userId });
    }

    return this.withUser(resolvedUserId =>
      this.apiService.post(`${this.baseUrl}/toggle`, { aiEnabled: enabled, userId: resolvedUserId })
    );
  }
}
