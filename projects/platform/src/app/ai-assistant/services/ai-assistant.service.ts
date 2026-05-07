import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services';

export interface Conversation {
  _id: string;
  customerWaId: string;
  customerName: string;
  status: 'active' | 'escalated' | 'resolved';
  lastMessageText: string;
  lastMessageAt: string;
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
  private baseUrl = 'api/v1/ai-assistant';

  getStats(): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/stats`);
  }

  getConversations(status?: string, page = 1, limit = 20): Observable<Conversation[]> {
    let url = `${this.baseUrl}/conversations?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return this.apiService.get<any>(url).pipe(map(res => res.data));
  }

  getMessages(conversationId: string, page = 1, limit = 50): Observable<Message[]> {
    return this.apiService.get<any>(`${this.baseUrl}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`).pipe(map(res => res.data));
  }

  sendMessage(conversationId: string, text: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/messages`, { text });
  }

  escalateConversation(conversationId: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/escalate`, {});
  }

  assignConversation(conversationId: string, assigneeId: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/assign`, { assigneeId });
  }

  getFaqs(): Observable<any[]> {
    return this.apiService.get<any>(`${this.baseUrl}/faqs`).pipe(map(res => res.data));
  }

  addFaq(data: { question: string; answer: string; category?: string; tags?: string[] }): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/faqs`, data);
  }

  updateFaq(id: string, data: any): Observable<any> {
    return this.apiService.put(`${this.baseUrl}/faqs/${id}`, data);
  }

  deleteFaq(id: string): Observable<any> {
    return this.apiService.delete(`${this.baseUrl}/faqs/${id}`);
  }

  getTemplates(): Observable<Template[]> {
    return this.apiService.get<any>(`${this.baseUrl}/templates`).pipe(map(res => res.data));
  }

  addTemplate(data: Partial<Template>): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/templates`, data);
  }

  updateTemplate(id: string, data: Partial<Template>): Observable<any> {
    return this.apiService.put(`${this.baseUrl}/templates/${id}`, data);
  }

  deleteTemplate(id: string): Observable<any> {
    return this.apiService.delete(`${this.baseUrl}/templates/${id}`);
  }

  getSettings(): Observable<any> {
    return this.apiService.get(`${this.baseUrl}/settings`);
  }

  updateSettings(data: any): Observable<any> {
    return this.apiService.put(`${this.baseUrl}/settings`, data);
  }

  toggleAI(enabled: boolean, userId: string): Observable<any> {
    return this.apiService.post(`${this.baseUrl}/toggle`, { aiEnabled: enabled, userId });
  }
}