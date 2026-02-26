import { Component, inject, OnInit, signal, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, Subject } from 'rxjs';

import { FeedService, FeedComment } from '../feed.service';
import { UserService } from '../../../common/services/user.service';

export interface CommentDialogData {
  postId: string;
}

@Component({
  selector: 'app-comment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './comment-dialog.component.html',
  styleUrls: ['./comment-dialog.component.scss'],
  providers: [FeedService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommentDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<CommentDialogComponent>);
  private feedService = inject(FeedService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private data: CommentDialogData = inject(MAT_DIALOG_DATA);

  private destroy$ = new Subject<void>();

  // State
  comments = signal<FeedComment[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  submitting = signal(false);
  hasMore = signal(true);
  currentPage = signal(1);
  newCommentText = signal('');
  replyText = signal('');
  replyingTo = signal<FeedComment | null>(null);

  // Current user
  currentUser = this.userService.user;

  ngOnInit(): void {
    this.loadComments(1, true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadComments(page: number, reset: boolean = false): void {
    const loadSignal = reset ? this.loading : this.loadingMore;
    loadSignal.set(true);

    this.feedService.getComments(this.data.postId, page, 20)
      .pipe(finalize(() => loadSignal.set(false)))
      .subscribe({
       next: (res) => {
          const data = res?.data || res;                     // handle both possible structures
          const fetched = data.comments || [];
          //console.log('Fetched comments:', fetched);
          if (reset) {
            this.comments.set(fetched);
          } else {
            this.comments.update(prev => [...prev, ...fetched]);
          }
          this.hasMore.set(page < (data.pages || 1));
          this.currentPage.set(page);
        },
        error: () => {
          this.snackBar.open('Failed to load comments', 'Dismiss', { duration: 3000 });
        }
      });
  }

  loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) return;
    this.loadComments(this.currentPage() + 1, false);
  }

  // Inside CommentDialogComponent

submitComment(): void {
  const content = this.newCommentText().trim();
  const userId = this.currentUser()?._id;
  if (!content || !userId || this.submitting()) return;

  this.submitting.set(true);
  this.feedService.addComment(this.data.postId, content, userId)
    .pipe(finalize(() => this.submitting.set(false)))
    .subscribe({
      next: (newComment) => {
        const comment = newComment?.data || newComment;    // extract if needed
        this.comments.update(comments => [comment, ...comments]);
        this.newCommentText.set('');
        this.snackBar.open('Comment added', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Failed to add comment', 'Dismiss', { duration: 3000 });
      }
    });
}

submitReply(parentComment: FeedComment): void {
  const content = this.replyText().trim();
  const userId = this.currentUser()?._id;
  if (!content || !userId || this.submitting()) return;

  this.submitting.set(true);
  this.feedService.addComment(this.data.postId, content, userId, parentComment._id)
    .pipe(finalize(() => this.submitting.set(false)))
    .subscribe({
      next: (newReply) => {
      const reply = newReply?.data || newReply;
      this.comments.update(comments =>
        comments.map(c => {
          if (c._id === parentComment._id) {
            return {
              ...c,
              replies: [reply, ...(c.replies || [])]
            };
          }
          return c;
        })
      );
      this.replyText.set('');
      this.replyingTo.set(null);
      this.snackBar.open('Reply added', 'OK', { duration: 2000 });
    },
      error: () => {
        this.snackBar.open('Failed to add reply', 'Dismiss', { duration: 3000 });
      }
    });
}

  toggleLike(comment: FeedComment, isReply: boolean = false, parent?: FeedComment): void {
    const userId = this.currentUser()?._id;
    if (!userId) return;

    const wasLiked = comment.isLiked;
    this.updateCommentLike(comment, !wasLiked, isReply, parent);

    this.feedService.likeComment(this.data.postId, comment._id, userId)
      .subscribe({
        error: () => {
          this.updateCommentLike(comment, wasLiked, isReply, parent);
          this.snackBar.open('Failed to update like', 'Dismiss', { duration: 2000 });
        }
      });
  }

 private updateCommentLike(comment: FeedComment, liked: boolean, isReply: boolean, parent?: FeedComment): void {
  if (isReply && parent) {
    this.comments.update(comments =>
      comments.map(c => {
        if (c._id === parent._id && c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => {
              if (r._id === comment._id) {
                return { ...r, isLiked: liked, likeCount: r.likeCount + (liked ? 1 : -1) };
              }
              return r;
            })
          };
        }
        return c;
      })
    );
  } else {
    this.comments.update(comments =>
      comments.map(c => {
        if (c._id === comment._id) {
          return { ...c, isLiked: liked, likeCount: c.likeCount + (liked ? 1 : -1) };
        }
        return c;
      })
    );
  }
}

  setReplyTo(comment: FeedComment): void {
    this.replyingTo.set(comment);
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyText.set('');
  }

  trackByCommentId(index: number, comment: FeedComment): string {
    return comment._id;
  }

  formatTime(dateString: string): string {
    return this.feedService.formatTime(dateString);
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop === target.clientHeight) {
      this.loadMore();
    }
  }
}