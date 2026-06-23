import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Subject, interval } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiService } from '@shared/services';

export interface CollaborationMessageEvent {
  conversationId?: string;
  _id?: string;
  content?: string;
  createdAt?: string | Date;
  sender?: {
    _id: string;
    displayName?: string;
    username?: string;
    avatar?: string;
    role?: string;
    isVerified?: boolean;
  };
}

export interface CollaborationConversationUpdateEvent {
  conversationId: string;
  lastMessageAt?: string | Date | null;
  lastMessagePreview?: string;
  lastMessageBy?: string | null;
}

export interface PresenceChangeEvent {
  userId: string;
  status: 'online' | 'offline';
  displayName?: string;
  timestamp: string;
}

export interface TypingEvent {
  userId: string;
  displayName: string;
  conversationId: string;
  action: 'start' | 'stop';
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class CollaborationRealtimeService {
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(Auth);

  private socket: Socket | null = null;
  private connectedUserId: string | null = null;
  private heartbeatInterval: any = null;

  private readonly collaborationMessageSubject = new Subject<CollaborationMessageEvent>();
  private readonly collaborationConversationUpdateSubject = new Subject<CollaborationConversationUpdateEvent>();
  private readonly presenceChangeSubject = new Subject<PresenceChangeEvent>();
  private readonly typingSubject = new Subject<TypingEvent>();

  readonly collaborationMessages$ = this.collaborationMessageSubject.asObservable();
  readonly collaborationConversationUpdates$ = this.collaborationConversationUpdateSubject.asObservable();
  readonly presenceChanged$ = this.presenceChangeSubject.asObservable();
  readonly typing$ = this.typingSubject.asObservable();

  /** Signal of currently online user IDs — updated by presence events. */
  readonly onlineUsers = signal<Set<string>>(new Set());

  connect(userId: string): void {
    if (!userId) {
      return;
    }

    if (this.socket?.connected && this.connectedUserId === userId) {
      return;
    }

    this.disconnect();
    this.connectedUserId = userId;
    void this.initializeSocket();
  }

  joinConversation(conversationId: string): void {
    if (!conversationId) {
      return;
    }

    this.socket?.emit('join_collaboration_conversation', conversationId);
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers().has(userId);
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.socket?.disconnect();
    this.socket = null;
    this.connectedUserId = null;
    this.onlineUsers.set(new Set());
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      this.socket?.emit('presence_heartbeat');
    }, 30000);
  }

  private async initializeSocket(): Promise<void> {
    const authStateReady = (this.auth as Auth & { authStateReady?: () => Promise<void> }).authStateReady?.() ?? Promise.resolve();
    await authStateReady;

    const token = this.auth.currentUser ? await this.auth.currentUser.getIdToken() : null;
    if (!token || !this.connectedUserId) {
      this.connectedUserId = null;
      return;
    }

    this.socket = io(this.apiService.getBaseUrl(), {
      auth: { token },
      transports: ['polling'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    this.socket.on('collaboration_message', (payload: CollaborationMessageEvent) => {
      this.collaborationMessageSubject.next(payload);
    });

    this.socket.on('collaboration_conversation_updated', (payload: CollaborationConversationUpdateEvent) => {
      this.collaborationConversationUpdateSubject.next(payload);
    });

    this.socket.on('presence_changed', (payload: PresenceChangeEvent) => {
      this.presenceChangeSubject.next(payload);
      this.onlineUsers.update((set) => {
        const next = new Set(set);
        if (payload.status === 'online') {
          next.add(payload.userId);
        } else {
          next.delete(payload.userId);
        }
        return next;
      });
    });

    this.socket.on('collaboration_typing', (payload: TypingEvent) => {
      this.typingSubject.next(payload);
    });

    this.startHeartbeat();
  }

  emitTyping(conversationId: string, action: 'start' | 'stop'): void {
    this.socket?.emit(`typing_${action}`, conversationId);
  }
}
