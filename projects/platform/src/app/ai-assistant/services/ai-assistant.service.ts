import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services';
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

  private get userId(): string {
    return this.userService.user()?._id || '';
  }

  private withUserId(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}userId=${encodeURIComponent(this.userId)}`;
  }

  getStats(): Observable<any> {
    return this.apiService.get(this.withUserId(`${this.baseUrl}/stats`));
  }

  getAnalytics(): Observable<any> {
    return this.apiService.get(this.withUserId(`${this.baseUrl}/analytics`));
  }

  getConversations(status?: string, page = 1, limit = 20, search = '', leadTag = ''): Observable<Conversation[]> {
    let url = `${this.baseUrl}/conversations?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (leadTag) url += `&leadTag=${encodeURIComponent(leadTag)}`;
    return this.apiService.get<any>(this.withUserId(url)).pipe(map(res => res.data));
  }

  getMessages(conversationId: string, page = 1, limit = 50): Observable<Message[]> {
    return this.apiService.get<any>(this.withUserId(`${this.baseUrl}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`)).pipe(map(res => res.data));
  }

  sendMessage(conversationId: string, text: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/messages`, { text, userId: this.userId });
  }

  escalateConversation(conversationId: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/escalate`, { userId: this.userId });
  }

  assignConversation(conversationId: string, assigneeId: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/assign`, { assigneeId, userId: this.userId });
  }

  takeoverConversation(conversationId: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/takeover`, { userId: this.userId });
  }

  resolveConversation(conversationId: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/resolve`, { userId: this.userId });
  }

  tagConversation(conversationId: string, leadTag: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/tag`, { userId: this.userId, leadTag });
  }

  sendQuickAction(conversationId: string, actionType: string, payload: any = {}): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/quick-action`, {
      userId: this.userId,
      actionType,
      payload,
    });
  }

  testAssistant(message: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/test`, { userId: this.userId, message });
  }

  getFaqs(): Observable<any[]> {
    return this.apiService.get<any>(this.withUserId(`${this.baseUrl}/faqs`)).pipe(map(res => res.data));
  }

  addFaq(data: { question: string; answer: string; category?: string; tags?: string[] }): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/faqs`, { ...data, userId: this.userId });
  }

  updateFaq(id: string, data: any): Observable<any> {
    return this.apiService.put(`${this.baseUrl}/faqs/${id}`, { ...data, userId: this.userId });
  }

  deleteFaq(id: string): Observable<any> {
    return this.apiService.delete(this.withUserId(`${this.baseUrl}/faqs/${id}`));
  }

  getTemplates(): Observable<Template[]> {
    return this.apiService.get<any>(this.withUserId(`${this.baseUrl}/templates`)).pipe(map(res => res.data));
  }

  addTemplate(data: Partial<Template>): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/templates`, { ...data, userId: this.userId });
  }

  updateTemplate(id: string, data: Partial<Template>): Observable<any> {
    return this.apiService.put(`${this.baseUrl}/templates/${id}`, { ...data, userId: this.userId });
  }

  deleteTemplate(id: string): Observable<any> {
    return this.apiService.delete(this.withUserId(`${this.baseUrl}/templates/${id}`));
  }

  getSettings(): Observable<any> {
    return this.apiService.get(this.withUserId(`${this.baseUrl}/settings`));
  }

  updateSettings(data: any): Observable<any> {
    return this.apiService.put(`${this.baseUrl}/settings`, { ...data, userId: this.userId });
  }

  toggleAI(enabled: boolean, userId?: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/toggle`, { aiEnabled: enabled, userId: userId || this.userId });
  }
}
