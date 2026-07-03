import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiService } from '@shared/services/api';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private connectedUserId: string | null = null;
  private messageSubject = new Subject<any>();
  private conversationUpdateSubject = new Subject<any>();

  public messages$ = this.messageSubject.asObservable();
  public conversationUpdates$ = this.conversationUpdateSubject.asObservable();

  constructor(private apiService: ApiService, private auth: Auth) {}

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

    this.socket.on('new_message', (data) => this.messageSubject.next(data));
    this.socket.on('conversation_updated', (data) => this.conversationUpdateSubject.next(data));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectedUserId = null;
  }

  joinConversation(conversationId: string): void {
    this.socket?.emit('join_conversation', conversationId);
  }

  sendTyping(conversationId: string): void {
    this.socket?.emit('typing', { conversationId });
  }
}
