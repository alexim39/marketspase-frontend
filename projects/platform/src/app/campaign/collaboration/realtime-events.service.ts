import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Subject } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class CollaborationRealtimeService {
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(Auth);

  private socket: Socket | null = null;
  private connectedUserId: string | null = null;

  private readonly collaborationMessageSubject = new Subject<CollaborationMessageEvent>();
  private readonly collaborationConversationUpdateSubject = new Subject<CollaborationConversationUpdateEvent>();

  readonly collaborationMessages$ = this.collaborationMessageSubject.asObservable();
  readonly collaborationConversationUpdates$ = this.collaborationConversationUpdateSubject.asObservable();

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

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectedUserId = null;
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
  }
}
