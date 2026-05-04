export interface Stats {
  totalMessages: number;
  aiHandled: number;
  responseTime: number; // seconds
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Message {
  id: string;
  sender: 'customer' | 'ai' | 'agent';
  text: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  status: 'active' | 'escalated';
  messages: Message[];
}

export interface AiSettings {
  tone: 'friendly' | 'professional' | 'sales';
  language: 'english' | 'pidgin';
}

export interface AutomationSettings {
  tone: 'friendly' | 'professional' | 'sales';
  language: 'english' | 'pidgin';
  escalateOnKeywords: boolean;
  escalateKeywords: string;
  lowConfidenceFallback: boolean;
  autoReplyEnabled: boolean;
}

export interface AnalyticsData {
  totalMessages: number;
  aiHandled: number;
  humanHandled: number;
  avgResponseTime: number;
  conversionRate: number;
  messagesByDay: { date: string; messages: number; ai: number; human: number }[];
}