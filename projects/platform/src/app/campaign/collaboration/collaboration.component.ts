import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CollaborationStarterCampaign,
  CollaborationStarterPromotion,
  CollaborationConversation,
  CollaborationMessage,
  CollaborationService,
} from './collaboration.service';
import { UserService } from '../../common/services/user.service';
import { CollaborationRealtimeService } from './realtime-events.service';
import { PinnedBannerComponent } from './components/pinned-banner/pinned-banner.component';
import { TypingIndicatorComponent } from './components/typing-indicator/typing-indicator.component';
import { MentionDropdownComponent } from './components/mention-dropdown/mention-dropdown.component';
import { MessageComposerComponent } from './components/composer/message-composer.component';

type ConversationKind = 'all' | 'direct' | 'campaign_room' | 'promotion_room' | 'context_room';

interface RouteOpenContext {
  conversationId: string | null;
  campaignId: string | null;
  promotionId: string | null;
  targetUserId: string | null;
}

interface RecentCollaborator {
  _id: string;
  displayName: string;
  username?: string;
  avatar?: string;
  role?: string;
  isVerified?: boolean;
  campaignId?: string | null;
  promotionId?: string | null;
}

@Component({
  selector: 'app-campaign-collaboration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TextFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    PinnedBannerComponent,
    TypingIndicatorComponent,
    MentionDropdownComponent,
    MessageComposerComponent,
  ],
  providers: [DatePipe, TitleCasePipe],
  templateUrl: './collaboration.component.html',
  styleUrls: ['./collaboration.component.scss'],
})
export class CampaignCollaborationComponent {
  private readonly collaborationService = inject(CollaborationService);
  private readonly realtimeService = inject(CollaborationRealtimeService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar = inject(MatSnackBar);
  private readonly datePipe = inject(DatePipe);
  private readonly titleCasePipe = inject(TitleCasePipe);

  readonly currentUser = this.userService.user;
  readonly loadingConversations = signal(true);
  readonly loadingMessages = signal(false);
  readonly loadingStarters = signal(false);
  readonly sendingMessage = signal(false);
  readonly resolvingEntry = signal(false);
  readonly conversations = signal<CollaborationConversation[]>([]);
  readonly starterCampaigns = signal<CollaborationStarterCampaign[]>([]);
  readonly starterPromotions = signal<CollaborationStarterPromotion[]>([]);
  readonly selectedConversation = signal<CollaborationConversation | null>(null);
  readonly messages = signal<CollaborationMessage[]>([]);
  readonly search = signal('');
  readonly draftMessage = signal('');
  readonly kindFilter = signal<ConversationKind>('all');
  readonly error = signal<string | null>(null);
  readonly typingUsers = signal<Map<string, string>>(new Map());
  readonly pinnedMessages = signal<CollaborationMessage[]>([]);
  readonly activeSection = signal<'activity' | 'direct' | 'rooms'>('activity');
  readonly mentionQuery = signal('');
  readonly mentionSuggestions = signal<Array<{ username: string; displayName: string }>>([]);
  readonly showMentionDropdown = signal(false);
  private typingTimer: any = null;
  readonly isMarketer = computed(() => this.currentUser()?.role === 'marketer');
  readonly isPromoter = computed(() => this.currentUser()?.role === 'promoter');
  protected readonly messageStreamRef = viewChild<ElementRef<HTMLElement>>('messageStream');

  readonly visibleConversations = computed(() => {
    const kind = this.kindFilter();
    const searchTerm = this.search().trim().toLowerCase();

    return this.conversations().filter((conversation) => {
      if (kind !== 'all' && conversation.type !== kind) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const counterpart = conversation.counterpart?.displayName || conversation.counterpart?.username || '';
      const haystack = [
        conversation.title,
        conversation.campaign?.title,
        conversation.metadata?.entityLabel,
        conversation.lastMessagePreview,
        counterpart,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  });

  readonly contextLabel = computed(() => {
    const conversation = this.selectedConversation();
    if (!conversation) {
      return '';
    }

    if (conversation.type === 'campaign_room') {
      return 'Campaign room';
    }

    if (conversation.type === 'promotion_room') {
      return 'Promotion room';
    }

    if (conversation.type === 'context_room') {
      return 'Linked room';
    }

    return 'Direct conversation';
  });

  readonly counterpartyLabel = computed(() => {
    const conversation = this.selectedConversation();
    if (!conversation) {
      return '';
    }

    if (conversation.counterpart?.displayName) {
      return conversation.counterpart.displayName;
    }

    return conversation.title;
  });

  readonly workspaceStats = computed(() => {
    const conversations = this.conversations();

    return {
      total: conversations.length,
      unread: conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0),
      direct: conversations.filter((conversation) => conversation.type === 'direct').length,
      rooms: conversations.filter((conversation) => conversation.type !== 'direct').length,
    };
  });

  readonly primaryStarterLabel = computed(() => {
    if (this.isMarketer()) {
      return this.findLatestCollaborationReadyCampaign()
        ? 'Open latest campaign room'
        : 'Review campaigns';
    }

    if (this.isPromoter()) {
      return this.starterPromotions().length
        ? 'Open latest promotion room'
        : 'View promotions';
    }

    return 'Refresh workbench';
  });

  readonly recentCollaborators = computed<RecentCollaborator[]>(() => {
    const currentUserId = this.currentUser()?._id;
    if (!currentUserId) {
      return [];
    }

    const seen = new Set<string>();
    const collaborators: RecentCollaborator[] = [];

    for (const conversation of this.conversations()) {
      const directCounterpart = conversation.counterpart;
      if (directCounterpart?._id && !seen.has(directCounterpart._id)) {
        seen.add(directCounterpart._id);
        collaborators.push({
          _id: directCounterpart._id,
          displayName: directCounterpart.displayName || directCounterpart.username || 'User',
          username: directCounterpart.username,
          avatar: directCounterpart.avatar,
          role: directCounterpart.role,
          isVerified: directCounterpart.isVerified,
          campaignId: conversation.campaign?._id || null,
          promotionId: conversation.promotion?._id || null,
        });
        continue;
      }

      for (const participant of conversation.participants || []) {
        const user = participant?.user;
        if (!user?._id || user._id === currentUserId || seen.has(user._id)) {
          continue;
        }

        seen.add(user._id);
        collaborators.push({
          _id: user._id,
          displayName: user.displayName || user.username || 'User',
          username: user.username,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified,
          campaignId: conversation.campaign?._id || null,
          promotionId: conversation.promotion?._id || null,
        });
      }
    }

    return collaborators.slice(0, 8);
  });

  private initializedForUserId: string | null = null;
  private optimisticMessageCounter = 0;
  private pendingOpenContext: RouteOpenContext = {
    conversationId: null,
    campaignId: null,
    promotionId: null,
    targetUserId: null,
  };

  constructor() {
    this.route.data
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const dataSection = (data as any)?.['section'];
        if (dataSection && !this.route.snapshot.queryParamMap.get('section')) {
          if (dataSection === 'direct') {
            this.kindFilter.set('direct');
            this.activeSection.set('direct');
          } else if (dataSection === 'rooms') {
            this.kindFilter.set('campaign_room');
            this.activeSection.set('rooms');
          }
        }
      });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.pendingOpenContext = {
          conversationId: params.get('conversationId'),
          campaignId: params.get('campaignId'),
          promotionId: params.get('promotionId'),
          targetUserId: params.get('targetUserId'),
        };
        const section = params.get('section') || (this.route.snapshot.data as any)?.['section'];
        if (section === 'direct') {
          this.kindFilter.set('direct');
          this.activeSection.set('direct');
        } else if (section === 'rooms') {
          this.kindFilter.set('campaign_room');
          this.activeSection.set('rooms');
        } else {
          this.activeSection.set('activity');
        }
        this.resolvePendingContext();
      });

    this.realtimeService.collaborationMessages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        this.appendIncomingMessage(payload as CollaborationMessage);
        this.loadConversations(false);
      });

    this.realtimeService.collaborationConversationUpdates$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((payload) => {
        this.conversations.update((conversations) =>
          conversations.map((conversation) =>
            conversation._id === payload.conversationId
              ? {
                  ...conversation,
                  lastMessageAt: payload.lastMessageAt || conversation.lastMessageAt,
                  lastMessagePreview: payload.lastMessagePreview || conversation.lastMessagePreview,
                  lastMessageBy: payload.lastMessageBy || conversation.lastMessageBy,
                }
              : conversation
          )
        );
      });

    this.realtimeService.typing$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        const currentConv = this.selectedConversation();
        if (!currentConv || event.conversationId !== currentConv._id) return;
        if (event.userId === this.currentUser()?._id) return;

        this.typingUsers.update((map) => {
          const next = new Map(map);
          if (event.action === 'start') {
            next.set(event.userId, event.displayName);
          } else {
            next.delete(event.userId);
          }
          return next;
        });
      });

    effect(() => {
      const user = this.currentUser();
      if (!user?._id || this.initializedForUserId === user._id) {
        return;
      }

      this.initializedForUserId = user._id;
      this.realtimeService.connect(user._id);
      this.loadConversations();
      this.loadStarterEntries();
    });

    effect(() => {
      const draft = this.draftMessage();
      const conv = this.selectedConversation();
      if (!conv) { this.showMentionDropdown.set(false); return; }

      if (draft.trim()) {
        this.realtimeService.emitTyping(conv._id, 'start');
        if (this.typingTimer) clearTimeout(this.typingTimer);
        this.typingTimer = setTimeout(() => { this.realtimeService.emitTyping(conv._id, 'stop'); }, 3000);
      }

      const idx = draft.lastIndexOf('@');
      if (idx !== -1 && !draft.slice(idx + 1).includes(' ')) {
        const query = draft.slice(idx + 1).toLowerCase();
        const participants = this.getConversationParticipants(conv);
        const filtered = participants.filter(p => p.username.toLowerCase().includes(query));
        this.mentionSuggestions.set(query ? filtered : participants);
        this.showMentionDropdown.set(filtered.length > 0 || !query);
      } else {
        this.showMentionDropdown.set(false);
      }
    });
  }

  refresh(): void {
    this.loadConversations();
    this.loadStarterEntries();
  }

  setKindFilter(kind: string): void {
    this.kindFilter.set(kind as ConversationKind);
    if (kind === 'direct') {
      this.activeSection.set('direct');
    } else if (kind === 'campaign_room' || kind === 'promotion_room') {
      this.activeSection.set('rooms');
    } else {
      this.activeSection.set('activity');
    }
  }

  selectConversation(conversation: CollaborationConversation, updateRoute: boolean = true): void {
    this.selectedConversation.set(conversation);
    this.messages.set([]);
    this.loadingMessages.set(true);
    this.error.set(null);
    this.realtimeService.joinConversation(conversation._id);

    if (updateRoute) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          conversationId: conversation._id,
          campaignId: null,
          promotionId: null,
          targetUserId: null,
        },
        queryParamsHandling: 'merge',
      });
    }

    this.collaborationService.getConversationMessages(conversation._id, 1, 60)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.messages.set(response.data.messages || []);
          this.loadingMessages.set(false);
          this.markConversationRead(conversation._id);
          this.upsertConversation(response.data.conversation, false);
          this.selectedConversation.set(response.data.conversation);
          this.queueMessageScroll('auto');
        },
        error: (error) => {
          this.loadingMessages.set(false);
          this.error.set(error?.error?.message || 'We could not load this conversation right now.');
        }
      });
  }

  onDraftChange(value: string): void {
    this.draftMessage.set(value);
    const conv = this.selectedConversation();
    if (!conv) return;

    if (value.trim()) {
      this.realtimeService.emitTyping(conv._id, 'start');
      if (this.typingTimer) clearTimeout(this.typingTimer);
      this.typingTimer = setTimeout(() => {
        this.realtimeService.emitTyping(conv._id, 'stop');
      }, 3000);
    } else {
      this.realtimeService.emitTyping(conv._id, 'stop');
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
        this.typingTimer = null;
      }
    }

    // Mention suggestion detection
    const cursorPos = this.extractMentionQuery(value);
    if (cursorPos !== null) {
      const afterAt = value.slice(cursorPos + 1);
      const query = afterAt.split(/\s/)[0].toLowerCase();
      this.mentionQuery.set(query);
      const allParticipants = this.getConversationParticipants(conv);
      const filtered = allParticipants.filter(
        (p) => p.username.toLowerCase().includes(query),
      );
      this.mentionSuggestions.set(query ? filtered : allParticipants);
      this.showMentionDropdown.set(true);
    } else {
      this.showMentionDropdown.set(false);
    }
  }

  readonly typingIndicatorText = computed(() => {
    const typing = this.typingUsers();
    if (typing.size === 0) return '';
    const names = Array.from(typing.values());
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]} and ${names.length - 1} others are typing...`;
  });

  private extractMentionQuery(value: string): number | null {
    const idx = value.lastIndexOf('@');
    if (idx === -1) return null;
    const afterAt = value.slice(idx + 1);
    if (afterAt.includes(' ')) return null;
    return idx;
  }

  private getConversationParticipants(conv: any): Array<{ userId: string; username: string; displayName: string }> {
    const result: Array<{ userId: string; username: string; displayName: string }> = [];
    const participants = conv.participants || [];

    for (const p of participants) {
      const user = p?.user || p || {};
      const username = user?.username || '';
      if (username && user?._id && user._id !== this.currentUser()?._id) {
        result.push({
          userId: String(user._id),
          username,
          displayName: user?.displayName || username,
        });
      }
    }

    // Fallback for direct chats: use counterpart if participants didn't yield results
    if (result.length === 0 && conv.type === 'direct' && conv.counterpart?.username) {
      result.push({
        userId: String(conv.counterpart._id),
        username: conv.counterpart.username,
        displayName: conv.counterpart.displayName || conv.counterpart.username,
      });
    }

    return result;
  }

  insertMention(suggestion: { username: string }): void {
    const draft = this.draftMessage();
    const idx = draft.lastIndexOf('@');
    if (idx === -1) return;
    const before = draft.slice(0, idx);
    const rest = draft.slice(idx).replace(/^@\w*/, `@${suggestion.username} `);
    const newValue = before + rest;
    this.draftMessage.set(newValue);
    this.showMentionDropdown.set(false);
    this.mentionQuery.set('');
  }

  sendMessage(): void {
    const conversation = this.selectedConversation();
    const content = this.draftMessage().trim();
    const attachment = this.pendingAttachment();
    if (!conversation || (!content && !attachment)) {
      return;
    }

    const atts = attachment ? [{ kind: attachment.kind, label: attachment.label, url: attachment.url }] : [];
    const optimisticMessage = this.createOptimisticMessage(conversation._id, content, atts);
    this.draftMessage.set('');
    this.pendingAttachment.set(null);
    this.appendOptimisticMessage(optimisticMessage);
    this.updateConversationPreview(conversation._id, content, optimisticMessage.createdAt, this.currentUser()?._id || null);
    this.sendingMessage.set(true);
    this.collaborationService.sendMessage(conversation._id, content, atts)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.sendingMessage.set(false);
          this.reconcileOptimisticMessage(optimisticMessage._id, response.data);
          this.markConversationRead(conversation._id);
          this.loadConversations(false);
        },
        error: (error) => {
          this.sendingMessage.set(false);
          this.markMessageFailed(optimisticMessage._id);
          this.snackBar.open(
            error?.error?.message || 'We could not send that message just now.',
            'Close',
            { duration: 3200 }
          );
        }
      });
  }

  openCampaignAnalytics(): void {
    this.router.navigate(['/dashboard/campaigns/analytics']);
  }

  openPrimaryStarter(): void {
    if (this.isMarketer()) {
      const campaign = this.findLatestCollaborationReadyCampaign();
      if (campaign) {
        this.openCampaignRoom(campaign._id);
        return;
      }

      this.router.navigate(['/dashboard/campaigns']);
      return;
    }

    if (this.isPromoter()) {
      const promotion = this.starterPromotions()[0];
      if (promotion?._id) {
        this.openPromotionRoom(promotion._id);
        return;
      }

      this.router.navigate(['/dashboard/campaigns/promotions']);
      return;
    }

    this.refresh();
  }

  formatConversationTitle(conversation: CollaborationConversation): string {
    if (conversation.type === 'direct' && conversation.counterpart) {
      return conversation.counterpart.displayName || `@${conversation.counterpart.username}`;
    }

    return conversation.title || conversation.metadata?.entityLabel || 'Collaboration room';
  }

  formatTime(value?: string | Date | null): string {
    if (!value) {
      return 'Just now';
    }

    return this.datePipe.transform(value, 'MMM d, h:mm a') || 'Just now';
  }

  formatConversationType(type: string): string {
    return this.titleCasePipe.transform(String(type || '').replace(/_/g, ' ')) || 'Conversation';
  }

  trackConversation(_index: number, conversation: CollaborationConversation): string {
    return conversation._id;
  }

  trackMessage(_index: number, message: CollaborationMessage): string {
    return message._id;
  }

  isOwnMessage(message: CollaborationMessage): boolean {
    return message.sender?._id === this.currentUser()?._id;
  }

  isSystemMessage(message: CollaborationMessage): boolean {
    return message.messageType === 'system';
  }

  isPendingMessage(message: CollaborationMessage): boolean {
    return message.deliveryStatus === 'pending';
  }

  isFailedMessage(message: CollaborationMessage): boolean {
    return (message as any).deliveryStatus === 'failed';
  }

  getMessageReadStatus(message: CollaborationMessage): string | null {
    const readBy = message.readBy || [];
    const otherReaders = readBy.filter((r) => r.user !== this.currentUser()?._id);
    if (otherReaders.length === 0) return null;

    const latestRead = otherReaders.reduce((latest, r) => {
      const time = new Date(r.readAt).getTime();
      return time > latest ? time : latest;
    }, 0);

    const diffMs = Date.now() - latestRead;
    if (diffMs < 60000) return 'Seen just now';
    if (diffMs < 3600000) return `Seen ${Math.floor(diffMs / 60000)}m ago`;
    return `Seen by ${otherReaders.length}`;
  }

  togglePinMessage(message: CollaborationMessage): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    const isPinned = (message as any).isPinned;
    const request = isPinned
      ? this.collaborationService.unpinMessage(conv._id, message._id)
      : this.collaborationService.pinMessage(conv._id, message._id);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.update((msgs) =>
          msgs.map((m) => m._id === message._id ? { ...m, isPinned: !isPinned } : m)
        );
        this.snackBar.open(isPinned ? 'Unpinned' : 'Pinned', 'OK', { duration: 1500 });
      },
      error: () => this.snackBar.open('Failed to update pin', 'Close', { duration: 2000 }),
    });
  }

  readonly quickEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  readonly activeReactionMsgId = signal<string | null>(null);

  toggleReact(message: CollaborationMessage, emoji: string): void {
    const conv = this.selectedConversation();
    if (!conv) return;

    this.collaborationService.reactToMessage(conv._id, message._id, emoji)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          const reactions = r?.data?.reactions || [];
          this.messages.update((msgs) =>
            msgs.map((m) => m._id === message._id ? { ...m, reactions } : m)
          );
        },
        error: () => null,
      });
  }

  showReactions(message: CollaborationMessage): void {
    this.activeReactionMsgId.set(this.activeReactionMsgId() === message._id ? null : message._id);
  }

  getReactionSummary(reactions?: Array<{ emoji: string }>): string {
    if (!reactions?.length) return '';
    const counts: Record<string, number> = {};
    reactions.forEach(r => counts[r.emoji] = (counts[r.emoji] || 0) + 1);
    return Object.entries(counts).map(([e, c]) => c > 1 ? `${e}${c}` : e).join(' ');
  }

  readonly pendingAttachment = signal<{ url: string; kind: string; label: string } | null>(null);

  onFileSelected(event: { file: File; kind: string }): void {
    const conv = this.selectedConversation();
    if (!conv) return;
    this.collaborationService.uploadAttachment(conv._id, event.file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.pendingAttachment.set(r.data);
          this.snackBar.open('File attached', 'OK', { duration: 1500 });
        },
        error: () => this.snackBar.open('Upload failed', 'Close', { duration: 2000 }),
      });
  }

  getMessageHtml(content: string): string {
    return String(content || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/@(\w{2,30})/g, '<span class="mention">@$1</span>');
  }

  retryFailedMessage(message: CollaborationMessage): void {
    if (!this.isFailedMessage(message) || !message.content?.trim()) {
      return;
    }

    this.messages.update((messages) => messages.filter((entry) => entry._id !== message._id));
    this.draftMessage.set(message.content);
    this.sendMessage();
  }

  onComposerKeydown(event: KeyboardEvent): void {
    // Send message on Enter, but allow newline with Shift/Ctrl/Alt
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Emoji picker support (lightweight fallback, zero external dependencies)
  private simpleEmojiPopover: HTMLElement | null = null;
  private simpleEmojiOutsideListener: (ev: Event) => void = () => {};
  private simpleEscapeListener = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') {
      this.hideSimpleEmojiPopover();
    }
  };

  /** Open emoji picker popover anchored to the clicked button. */
  openEmojiPicker(ev: MouseEvent | PointerEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    const anchor = ev.currentTarget as HTMLElement | null;
    this.hideSimpleEmojiPopover();
    this.openSimpleEmojiPopover(anchor);
  }

  /** Insert emoji string at current caret into the composer textarea. */
  insertEmojiAtCursor(emoji: string) {
    const textarea = document.querySelector('.composer-field--chat textarea') as HTMLTextAreaElement | null;

    if (!textarea) {
      // fallback: append to signal
      this.draftMessage.set((this.draftMessage() || '') + emoji);
      return;
    }

    const start = typeof textarea.selectionStart === 'number' ? textarea.selectionStart : textarea.value.length;
    const end = typeof textarea.selectionEnd === 'number' ? textarea.selectionEnd : textarea.value.length;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const next = before + emoji + after;

    // Update model (Angular binding)
    this.draftMessage.set(next);

    // Update visible textarea and reposition caret after emoji
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + emoji.length;
      textarea.setSelectionRange(pos, pos);
    });

    this.hideSimpleEmojiPopover();
  }

  /** Minimal emoji popover (built-in, no dependencies). */
  private openSimpleEmojiPopover(anchor: HTMLElement | null) {
    if (!anchor) return;
    this.hideSimpleEmojiPopover();

    const emojis = ['😀', '😂', '😊', '😍', '🥰', '👍', '🔥', '🎉', '🙌', '🤝', '🙏', '😅', '🤩', '💯', '🚀', '✨'];
    const pop = document.createElement('div');
    pop.className = 'simple-emoji-popover';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', 'Emoji picker');

    const inner = document.createElement('div');
    inner.className = 'simple-emoji-list';
    emojis.forEach((ch) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'simple-emoji-item';
      btn.textContent = ch;
      btn.title = ch;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.insertEmojiAtCursor(ch);
      });
      inner.appendChild(btn);
    });
    pop.appendChild(inner);
    document.body.appendChild(pop);
    this.simpleEmojiPopover = pop;

    // Position near anchor (top-left of button, fallback below if near top)
    const rect = anchor.getBoundingClientRect();
    const gap = 8;
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - 280);
    let top = rect.top - pop.offsetHeight - gap;
    if (top < 8) {
      top = rect.bottom + gap;
    }
    pop.style.position = 'fixed';
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.style.zIndex = '5000';

    // Close on outside click or Esc
    this.simpleEmojiOutsideListener = (ev: Event) => {
      if (!pop.contains(ev.target as Node) && ev.target !== anchor) {
        this.hideSimpleEmojiPopover();
      }
    };
    document.addEventListener('click', this.simpleEmojiOutsideListener, { capture: true });
    document.addEventListener('keydown', this.simpleEscapeListener);
  }

  /** Remove emoji popover. */
  private hideSimpleEmojiPopover() {
    if (this.simpleEmojiPopover) {
      try {
        this.simpleEmojiPopover.remove();
      } catch {}
      this.simpleEmojiPopover = null;
    }
    if (this.simpleEmojiOutsideListener) {
      document.removeEventListener('click', this.simpleEmojiOutsideListener as EventListener, { capture: true });
      this.simpleEmojiOutsideListener = () => {};
    }
    document.removeEventListener('keydown', this.simpleEscapeListener);
  }

  getMessageSenderName(message: CollaborationMessage): string {
    if (this.isOwnMessage(message)) {
      return 'You';
    }

    return message.sender?.displayName || message.sender?.username || 'User';
  }

  getMessageSenderInitial(message: CollaborationMessage): string {
    return this.getMessageSenderName(message).charAt(0).toUpperCase();
  }

  trackStarterCampaign(_index: number, campaign: CollaborationStarterCampaign): string {
    return campaign._id;
  }

  trackStarterPromotion(_index: number, promotion: CollaborationStarterPromotion): string {
    return promotion._id;
  }

  trackCollaborator(_index: number, collaborator: RecentCollaborator): string {
    return collaborator._id;
  }

  canOpenCampaignRoom(campaign: CollaborationStarterCampaign | null | undefined): boolean {
    if (!campaign) {
      return false;
    }

    return Number(campaign.promotionSummary?.uniquePromoters ?? campaign.totalPromotions ?? 0) > 0;
  }

  getCampaignStarterNote(campaign: CollaborationStarterCampaign): string {
    if (this.canOpenCampaignRoom(campaign)) {
      const promoters = Number(campaign.promotionSummary?.uniquePromoters ?? campaign.totalPromotions ?? 0);
      return `${promoters} promoter${promoters === 1 ? '' : 's'} already linked.`;
    }

    return 'Room unlocks as soon as a promoter accepts this campaign.';
  }

  getPromotionStarterNote(promotion: CollaborationStarterPromotion): string {
    const trackedClicks = Number(promotion.clickStats?.totalClicks ?? 0);
    const billableClicks = Number(promotion.clickStats?.billableClicks ?? 0);
    return trackedClicks > 0
      ? `${trackedClicks} tracked clicks, ${billableClicks} billable so far.`
      : 'No click activity yet. Use the room to align on copy, timing, or support.';
  }

  getPromotionOwnerId(promotion: CollaborationStarterPromotion | null | undefined): string | null {
    const owner = promotion?.campaign?.owner as
      | { _id?: string | null }
      | string
      | null
      | undefined;

    if (!owner) {
      return null;
    }

    if (typeof owner === 'string') {
      return owner;
    }

    return owner._id || null;
  }

  openCampaignRoom(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns/collaboration'], {
      queryParams: {
        campaignId,
        promotionId: null,
        targetUserId: null,
        conversationId: null,
      },
    });
  }

  openPromotionRoom(promotionId: string): void {
    this.router.navigate(['/dashboard/campaigns/collaboration'], {
      queryParams: {
        promotionId,
        campaignId: null,
        targetUserId: null,
        conversationId: null,
      },
    });
  }

  openDirectChat(targetUserId: string, campaignId?: string | null, promotionId?: string | null): void {
    this.router.navigate(['/dashboard/campaigns/collaboration'], {
      queryParams: {
        targetUserId,
        campaignId: campaignId || null,
        promotionId: promotionId || null,
        conversationId: null,
      },
    });
  }

  openCampaignDetails(campaignId: string): void {
    this.router.navigate(['/dashboard/campaigns', campaignId]);
  }

  openPromotionDetails(promotionId: string): void {
    this.router.navigate(['/dashboard/campaigns/promotions', promotionId]);
  }

  private loadConversations(resolvePending: boolean = true): void {
    this.loadingConversations.set(true);
    this.collaborationService.getConversations('all')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.conversations.set(response.data || []);
          this.loadingConversations.set(false);

          if (resolvePending) {
            this.resolvePendingContext();
          } else if (!this.selectedConversation() && response.data?.length) {
            this.selectConversation(response.data[0], false);
          }
        },
        error: (error) => {
          this.loadingConversations.set(false);
          this.error.set(error?.error?.message || 'We could not load collaboration threads.');
        }
      });
  }

  private resolvePendingContext(): void {
    const user = this.currentUser();
    if (!user?._id) {
      return;
    }

    const { conversationId, campaignId, promotionId, targetUserId } = this.pendingOpenContext;

    if (conversationId) {
      const matched = this.conversations().find((conversation) => conversation._id === conversationId);
      if (matched) {
        this.pendingOpenContext = { conversationId: null, campaignId: null, promotionId: null, targetUserId: null };
        this.selectConversation(matched, false);
        return;
      }
    }

    if (this.resolvingEntry()) {
      return;
    }

    if (targetUserId) {
      this.resolvingEntry.set(true);
      this.collaborationService.createDirectConversation({
        targetUserId,
        campaignId,
        promotionId,
      })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.resolvingEntry.set(false);
            this.pendingOpenContext = { conversationId: null, campaignId: null, promotionId: null, targetUserId: null };
            this.upsertConversation(response.data, true);
          },
          error: () => {
            this.resolvingEntry.set(false);
          }
        });
      return;
    }

    if (campaignId) {
      this.resolvingEntry.set(true);
      this.collaborationService.openCampaignConversation(campaignId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.resolvingEntry.set(false);
            this.pendingOpenContext = { conversationId: null, campaignId: null, promotionId: null, targetUserId: null };
            this.upsertConversation(response.data, true);
          },
          error: () => {
            this.resolvingEntry.set(false);
          }
        });
      return;
    }

    if (promotionId) {
      this.resolvingEntry.set(true);
      this.collaborationService.openPromotionConversation(promotionId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.resolvingEntry.set(false);
            this.pendingOpenContext = { conversationId: null, campaignId: null, promotionId: null, targetUserId: null };
            this.upsertConversation(response.data, true);
          },
          error: () => {
            this.resolvingEntry.set(false);
          }
        });
      return;
    }

    const selected = this.selectedConversation();
    if (!selected && this.conversations().length) {
      this.selectConversation(this.conversations()[0], false);
    }
  }

  private loadStarterEntries(): void {
    const user = this.currentUser();
    if (!user?._id) {
      return;
    }

    this.loadingStarters.set(true);

    if (user.role === 'marketer') {
      this.collaborationService.getMarketerCampaignEntries(user._id, 6)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.starterCampaigns.set((response.data || []).slice(0, 6));
            this.starterPromotions.set([]);
            this.loadingStarters.set(false);
          },
          error: () => {
            this.starterCampaigns.set([]);
            this.starterPromotions.set([]);
            this.loadingStarters.set(false);
          }
        });
      return;
    }

    if (user.role === 'promoter') {
      this.collaborationService.getPromoterPromotionEntries(user._id, 6)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.starterPromotions.set((response.data || []).slice(0, 6));
            this.starterCampaigns.set([]);
            this.loadingStarters.set(false);
          },
          error: () => {
            this.starterCampaigns.set([]);
            this.starterPromotions.set([]);
            this.loadingStarters.set(false);
          }
        });
      return;
    }

    this.starterCampaigns.set([]);
    this.starterPromotions.set([]);
    this.loadingStarters.set(false);
  }

  private findLatestCollaborationReadyCampaign(): CollaborationStarterCampaign | null {
    return this.starterCampaigns().find((campaign) => this.canOpenCampaignRoom(campaign)) || null;
  }

  private upsertConversation(conversation: CollaborationConversation, selectAfter: boolean = false): void {
    this.conversations.update((entries) => {
      const existingIndex = entries.findIndex((entry) => entry._id === conversation._id);
      if (existingIndex === -1) {
        return [conversation, ...entries];
      }

      const next = [...entries];
      next[existingIndex] = conversation;
      return next.sort((left, right) =>
        new Date(right.lastMessageAt || right.updatedAt || 0).getTime()
        - new Date(left.lastMessageAt || left.updatedAt || 0).getTime()
      );
    });

    if (selectAfter) {
      const nextConversation = this.conversations().find((entry) => entry._id === conversation._id) || conversation;
      this.selectConversation(nextConversation);
    }
  }

  private appendIncomingMessage(message: CollaborationMessage): void {
    if (!message?._id) {
      return;
    }

    const selectedConversation = this.selectedConversation();
    const messageConversationId = String((message as CollaborationMessage & { conversationId?: string }).conversation || (message as CollaborationMessage & { conversationId?: string }).conversationId || '');
    if (selectedConversation?._id && messageConversationId && selectedConversation._id !== messageConversationId) {
      return;
    }

    this.messages.update((messages) => {
      const sentMessage: CollaborationMessage = {
        ...message,
        deliveryStatus: 'sent',
        isOptimistic: false,
      };
      const existingIndex = messages.findIndex((entry) => entry._id === message._id);

      if (existingIndex >= 0) {
        const next = [...messages];
        next[existingIndex] = { ...next[existingIndex], ...sentMessage };
        return this.sortMessages(next);
      }

      const pendingIndex = this.findMatchingPendingMessage(messages, sentMessage);
      if (pendingIndex >= 0) {
        const next = [...messages];
        next[pendingIndex] = sentMessage;
        return this.sortMessages(next);
      }

      return this.sortMessages([...messages, sentMessage]);
    });
    this.queueMessageScroll();
  }

  private appendOptimisticMessage(message: CollaborationMessage): void {
    this.messages.update((messages) => this.sortMessages([...messages, message]));
    this.queueMessageScroll();
  }

  private reconcileOptimisticMessage(localMessageId: string, serverMessage: CollaborationMessage): void {
    this.messages.update((messages) => {
      const sentMessage: CollaborationMessage = {
        ...serverMessage,
        deliveryStatus: 'sent',
        isOptimistic: false,
      };
      const serverIndex = messages.findIndex((entry) => entry._id === sentMessage._id);
      const localIndex = messages.findIndex((entry) => entry._id === localMessageId);

      if (serverIndex >= 0) {
        const next = messages.filter((entry) => entry._id !== localMessageId);
        const normalizedIndex = next.findIndex((entry) => entry._id === sentMessage._id);
        if (normalizedIndex >= 0) {
          next[normalizedIndex] = { ...next[normalizedIndex], ...sentMessage };
        }
        return this.sortMessages(next);
      }

      if (localIndex >= 0) {
        const next = [...messages];
        next[localIndex] = sentMessage;
        return this.sortMessages(next);
      }

      return this.sortMessages([...messages, sentMessage]);
    });
    this.queueMessageScroll();
  }

  private markMessageFailed(localMessageId: string): void {
    this.messages.update((messages) =>
      messages.map((message) =>
        message._id === localMessageId
          ? { ...message, deliveryStatus: 'failed', isOptimistic: true }
          : message
      )
    );
  }

  private createOptimisticMessage(conversationId: string, content: string, attachments: any[] = []): CollaborationMessage {
    const user = this.currentUser();
    const now = new Date().toISOString();
    const displayName = user?.displayName || user?.username || 'You';

    return {
      _id: `local-${Date.now()}-${++this.optimisticMessageCounter}`,
      conversation: conversationId,
      sender: {
        _id: user?._id || 'local-user',
        displayName,
        username: user?.username || displayName,
        avatar: user?.avatar,
        role: user?.role,
        isVerified: Boolean(user?.verified),
      },
      content,
      messageType: 'text',
      attachments,
      createdAt: now,
      updatedAt: now,
      deliveryStatus: 'pending',
      isOptimistic: true,
    };
  }

  private updateConversationPreview(
    conversationId: string,
    content: string,
    createdAt: string | Date,
    senderId: string | null
  ): void {
    const preview = content.slice(0, 280);
    const applyPreview = (conversation: CollaborationConversation): CollaborationConversation =>
      conversation._id === conversationId
        ? {
            ...conversation,
            lastMessageAt: createdAt,
            lastMessagePreview: preview,
            lastMessageBy: senderId,
            unreadCount: 0,
          }
        : conversation;

    this.conversations.update((conversations) =>
      conversations
        .map(applyPreview)
        .sort((left, right) =>
          new Date(right.lastMessageAt || right.updatedAt || 0).getTime()
          - new Date(left.lastMessageAt || left.updatedAt || 0).getTime()
        )
    );

    const selected = this.selectedConversation();
    if (selected?._id === conversationId) {
      this.selectedConversation.set(applyPreview(selected));
    }
  }

  private findMatchingPendingMessage(messages: CollaborationMessage[], message: CollaborationMessage): number {
    const messageCreatedAt = new Date(message.createdAt || Date.now()).getTime();

    return messages.findIndex((entry) => {
      if (entry.deliveryStatus !== 'pending' || entry.sender?._id !== message.sender?._id) {
        return false;
      }

      const entryCreatedAt = new Date(entry.createdAt || Date.now()).getTime();
      return entry.content === message.content && Math.abs(messageCreatedAt - entryCreatedAt) < 120000;
    });
  }

  private sortMessages(messages: CollaborationMessage[]): CollaborationMessage[] {
    return [...messages].sort((left, right) =>
      new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime()
    );
  }

  private queueMessageScroll(behavior: ScrollBehavior = 'smooth'): void {
    setTimeout(() => {
      const stream = this.messageStreamRef()?.nativeElement;
      if (!stream) {
        return;
      }

      stream.scrollTo({
        top: stream.scrollHeight,
        behavior,
      });
    });
  }

  private markConversationRead(conversationId: string): void {
    this.collaborationService.markConversationRead(conversationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.conversations.update((conversations) =>
            conversations.map((conversation) =>
              conversation._id === conversationId
                ? { ...conversation, unreadCount: 0 }
                : conversation
            )
          );
        },
        error: () => null,
      });
  }
}
