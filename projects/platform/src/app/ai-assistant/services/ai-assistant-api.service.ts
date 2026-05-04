// src/app/features/ai-assistant/services/ai-assistant-api.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Stats, FAQ, Conversation, Message, AiSettings, AutomationSettings, AnalyticsData } from '../models/assistant.model';
import { ApiService } from '@shared/services';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface BackendConversation {
  _id: string;
  customerName: string;
  lastMessageText: string;
  status: string;
  lastMessageAt?: string;
}

interface BackendMessage {
  _id: string;
  content: string;
  direction: string;
  source: string;
  timestamp: string;
}

@Injectable()
export class AiAssistantApiService {
  private baseUrl = 'api/v1/ai-assistant';  

  private apiService: ApiService = inject(ApiService);

  // ---------- Stats ----------
  getStats(userId: string): Observable<Stats> {
    return this.apiService.get<ApiResponse<Stats>>(`${this.baseUrl}/stats/${userId}`, undefined, undefined, true).pipe(
      map(res => res.data)
    );
  }


  // ---------- FAQs ----------
  getFaqs(userId: string): Observable<FAQ[]> {
    return this.apiService.get<ApiResponse<any[]>>(`${this.baseUrl}/faqs/${userId}`).pipe(
      map(res => res.data.map(f => this.transformFaq(f)))
    );
  }

  addFaq(userId: string, question: string, answer: string): Observable<FAQ> {
    return this.apiService.post<ApiResponse<any>>(`${this.baseUrl}/faqs`, { userId, question, answer }).pipe(
      map(res => this.transformFaq(res.data))
    );
  }

  updateFaq(id: string, updates: Partial<FAQ>): Observable<FAQ> {
    return this.apiService.put<ApiResponse<any>>(`${this.baseUrl}/faqs/${id}`, {
      question: updates.question,
      answer: updates.answer,
    }).pipe(map(res => this.transformFaq(res.data)));
  }

  deleteFaq(id: string): Observable<void> {
    return this.apiService.delete<ApiResponse<void>>(`${this.baseUrl}/faqs/${id}`).pipe(map(() => void 0));
  }

  // ---------- Conversations ----------
  getConversations(userId: string): Observable<Conversation[]> {
    return this.apiService.get<ApiResponse<BackendConversation[]>>(`${this.baseUrl}/conversations/${userId}`).pipe(
      map(res => res.data.map(c => ({
        id: c._id,
        customerName: c.customerName,
        lastMessage: c.lastMessageText,
        status: c.status === 'resolved' ? 'escalated' : c.status as 'active' | 'escalated',
        messages: [],   // messages loaded separately
      })))
    );
  }

  getMessages(conversationId: string): Observable<Message[]> {
    return this.apiService.get<ApiResponse<BackendMessage[]>>(`${this.baseUrl}/conversations/${conversationId}/messages`)
      .pipe(map(res => res.data.map(m => ({
        id: m._id,
        sender: this.mapSourceToSender(m.source),
        text: m.content,
        timestamp: new Date(m.timestamp),
      }))));
  }

  sendMessage(conversationId: string, text: string): Observable<void> {
    return this.apiService.post(`${this.baseUrl}/conversations/${conversationId}/messages`, { text }).pipe(map(() => void 0));
  }

  escalateConversation(conversationId: string): Observable<Conversation> {
    return this.apiService.post<ApiResponse<BackendConversation>>(`${this.baseUrl}/conversations/${conversationId}/escalate`, {})
      .pipe(map(res => ({
        id: res.data._id,
        customerName: res.data.customerName,
        lastMessage: res.data.lastMessageText,
        status: res.data.status === 'resolved' ? 'escalated' : res.data.status as 'active' | 'escalated',
        messages: [],
      })));
  }

  // ---------- Settings ----------
  getSettings(userId: string): Observable<AiSettings> {
    return this.apiService.get<ApiResponse<any>>(`${this.baseUrl}/settings/${userId}`).pipe(
      map(res => ({
        tone: res.data.tone,
        language: res.data.language,
      }))
    );
  }

  updateSettings(userId: string, updates: Partial<AiSettings>): Observable<AiSettings> {
    return this.apiService.put<ApiResponse<any>>(`${this.baseUrl}/settings/${userId}`, updates).pipe(
      map(res => ({
        tone: res.data.tone,
        language: res.data.language,
      }))
    );
  }

  // Toggle AI
  toggleAI(enabled: boolean): Observable<{ aiEnabled: boolean }> {
    return this.apiService.post<ApiResponse<any>>(`${this.baseUrl}/toggle`, { aiEnabled: enabled }).pipe(
      map(res => ({ aiEnabled: res.data.aiEnabled }))
    );
  }

  // ---------- Helpers ----------
  private transformFaq(backend: any): FAQ {
    return {
      id: backend._id,
      question: backend.question,
      answer: backend.answer,
    };
  }

  private mapSourceToSender(source: string): 'customer' | 'ai' | 'agent' {
    if (source === 'customer') return 'customer';
    if (source === 'ai' || source === 'faq') return 'ai';
    if (source === 'agent') return 'agent';
    return 'ai'; // fallback
  }





  // get automation settings (mock)
getAutomationSettings(userId: string): Observable<AutomationSettings> {
  return of({
    tone: 'friendly',
    language: 'english',
    escalateOnKeywords: true,
    escalateKeywords: 'refund,complaint',
    lowConfidenceFallback: true,
    autoReplyEnabled: true,
  });
}

// update automation settings
updateAutomationSettings(userId: string, settings: Partial<AutomationSettings>): Observable<AutomationSettings> {
  return of(settings as AutomationSettings).pipe(delay(200));
}

// get analytics data
getAnalytics(userId: string): Observable<AnalyticsData> {
  const data: AnalyticsData = {
    totalMessages: 1250,
    aiHandled: 890,
    humanHandled: 360,
    avgResponseTime: 4.2,
    conversionRate: 12.5,
    messagesByDay: [
      { date: 'Mon', messages: 120, ai: 85, human: 35 },
      { date: 'Tue', messages: 180, ai: 140, human: 40 },
      { date: 'Wed', messages: 220, ai: 170, human: 50 },
      { date: 'Thu', messages: 160, ai: 110, human: 50 },
      { date: 'Fri', messages: 210, ai: 160, human: 50 },
      { date: 'Sat', messages: 140, ai: 90, human: 50 },
      { date: 'Sun', messages: 220, ai: 135, human: 85 },
    ],
  };
  return of(data).pipe(delay(400));
}

}