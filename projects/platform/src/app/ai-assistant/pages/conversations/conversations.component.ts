// conversations.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, combineLatest, map } from 'rxjs';
import { AiAssistantService } from '../../services/ai-assistant.service';
import { Conversation } from '../../models/assistant.model';
import { ConversationListComponent } from '../../components/conversation-list/conversation-list.component';
import { ChatWindowComponent } from '../../components/chat-window/chat-window.component';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [CommonModule, ConversationListComponent, ChatWindowComponent],
  templateUrl: './conversations.component.html',
  styleUrls: ['./conversations.component.scss'],
})
export class ConversationsComponent implements OnInit {
  private service = inject(AiAssistantService);

  conversations$!: Observable<Conversation[]>;
  selectedId$ = this.service.selectedConversationId$;
  selectedConversation$!: Observable<Conversation | undefined>;

  ngOnInit(): void {
    this.conversations$ = this.service.conversations$;
    this.selectedConversation$ = combineLatest([
      this.conversations$,
      this.selectedId$,
    ]).pipe(
      map(([convs, id]) => convs.find(c => c.id === id))
    );
  }
}