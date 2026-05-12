import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ApiService } from '@shared/services';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private connectedUserId: string | null = null;
  private messageSubject = new Subject<any>();
  private conversationUpdateSubject = new Subject<any>();

  public messages$ = this.messageSubject.asObservable();
  public conversationUpdates$ = this.conversationUpdateSubject.asObservable();

  constructor(private apiService: ApiService) {}

  connect(userId: string): void {
    if (!userId) {
      return;
    }

    if (this.socket?.connected && this.connectedUserId === userId) {
      return;
    }

    this.disconnect();
    this.connectedUserId = userId;
    this.socket = io(this.apiService.getBaseUrl(), {
      query: { userId },
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
