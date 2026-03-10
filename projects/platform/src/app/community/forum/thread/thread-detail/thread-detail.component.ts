import { 
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, 
  ChangeDetectorRef, inject, 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormControl, ReactiveFormsModule, Validators, 
  FormsModule, FormGroup 
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, switchMap, tap } from 'rxjs';

import { ForumService, Thread, Comment } from '../../forum.service';
import { CommentComponent } from '../../comment/comment.component';
import { timeAgo as timeAgoUtil } from '../../../../common/utils/time.util';
import { SanitizeHtmlPipe } from '../../../../common/pipes/sanitize-html.pipe';
import { UserService } from '../../../../common/services/user.service';
import { ApiService } from '../../../../../../../shared-services/src/public-api';

@Component({
  selector: 'app-thread-detail',
  standalone: true,
  providers: [ForumService, ApiService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CommentComponent,
    SanitizeHtmlPipe
  ],
  templateUrl: './thread-detail.component.html',
  styleUrls: ['./thread-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThreadDetailComponent implements OnInit, OnDestroy {
  private forumService = inject(ForumService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private cd = inject(ChangeDetectorRef);
  public apiService = inject(ApiService);

  // Component State
  thread: Thread | null = null;
  comments: Comment[] = [];
  //currentUser: UserInterface | null = null;
  loadingStates = false;
  isSubmitting = false;
  error: string | null = null;

  private userService = inject(UserService);
  public user = this.userService.user;

  // Form Controls
  commentForm = new FormGroup({
    content: new FormControl('', [
      Validators.required,
      Validators.maxLength(2000)
    ])
  });

  // Cleanup
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.loadThreadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getMediaType(media: Thread['media']): string {
    if (!media) return '';
    const extension = media.filename.split('.').pop()?.toLowerCase();
    
    switch (media.type) {
      case 'image':
        return `image/${extension}`;
      case 'video':
        return `video/${extension}`;
      case 'audio':
        return `audio/${extension}`;
      default:
        return '';
    }
  }

  public loadThreadData(): void {
    this.route.params.pipe(
      tap(() => {
        this.loadingStates = true;
        this.error = null;
        this.cd.markForCheck();
      }),
      switchMap(params => this.forumService.getThreadById(params['threadId'])),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.thread = response.data || null;
        this.loadingStates = false;
        if (response.data) {
          this.comments = response.data.comments || [];
          this.cd.markForCheck();
        }
      },
      error: (err) => {
        this.error = 'Failed to load thread';
        this.loadingStates = false;
        this.cd.markForCheck();
      }
    });
  }

  toggleLikeThread(): void {
    if (!this.thread || !this.user()) return;

    // Optimistic UI update
    const wasLiked = this.thread.isLiked;
    this.thread.isLiked = !wasLiked;
    this.thread.likeCount += this.thread.isLiked ? 1 : -1;
    this.cd.markForCheck();

    this.forumService.toggleLikeThread(this.thread._id, this.user()?._id ?? '').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.thread = response.data;
          this.cd.markForCheck();
        }
      },
      error: (err) => {
        // Revert UI on error
        this.thread!.isLiked = wasLiked;
        this.thread!.likeCount += wasLiked ? 1 : -1;
        this.cd.markForCheck();
        this.showError('Failed to update like');
      }
    });
  }

  addComment(): void {
    if (this.commentForm.invalid || !this.thread || !this.user()) return;

    this.isSubmitting = true;
    const content = this.commentForm.value.content || '';

    this.forumService.addComment(this.thread._id, content, this.user()?._id ?? '').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.comments = [response.data, ...this.comments];
          if (this.thread) {
            this.thread.commentCount++;
          }
          this.commentForm.reset();
        }
        this.isSubmitting = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.showError('Failed to post comment', () => this.addComment());
        this.isSubmitting = false;
        this.cd.markForCheck();
      }
    });
  }

  toggleLikeComment(commentId: string): void {
    if (!this.thread || !this.user()) return;

    this.forumService.toggleLikeComment(commentId, this.user()?._id ?? '').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (updatedComment) => {
        if (updatedComment) {
          this.updateCommentInList(updatedComment);
          this.cd.markForCheck();
        }
      },
      error: (err) => {
        this.showError('Failed to update like');
      }
    });
  }

  onCommentDeleted(commentId: any) {
    this.comments = this.comments.filter(c => c._id !== commentId);
    this.snackBar.open('Comment has been deleted', 'Close', { duration: 3000 });
    if (this.thread) {
      this.thread.commentCount = Math.max(0, this.thread.commentCount - 1);
    }
  }

  private updateCommentInList(updatedComment: Comment): void {
    const index = this.comments.findIndex(c => c._id === updatedComment._id);
    if (index !== -1) {
      this.comments[index] = updatedComment;
    }
  }

  private showError(message: string, retryAction?: () => void): void {
    const snackBarRef = this.snackBar.open(message, retryAction ? 'Retry' : 'Close', {
      duration: 3000,
      panelClass: 'error-snackbar'
    });

    if (retryAction) {
      snackBarRef.onAction().subscribe(() => retryAction());
    }
  }

  trackByCommentId(index: number, comment: Comment): string {
    return comment._id;
  }

  isCommentAuthor(comment: Comment): boolean {
    return this.user()?._id === comment.author._id;
  }

  handleBack(): void {
    this.router.navigate(['/dashboard/community/discussion']);
  }

  get remainingChars(): number {
    return 2000 - (this.commentForm.value.content?.length || 0);
  }

  timeAgo(date: string | Date): string {
    return timeAgoUtil(date);
  }

  viewProfile(userId: string) {
    this.router.navigate(['/dashboard/profile', userId]);
  }
}