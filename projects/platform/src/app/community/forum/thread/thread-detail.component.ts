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

import { ForumService, Thread, Comment } from '../forum.service';
import { CommentComponent } from '../comment/comment.component';
import { timeAgo as timeAgoUtil } from '../../../common/utils/time.util';
import { SanitizeHtmlPipe } from '../../../common/pipes/sanitize-html.pipe';
import { UserService } from '../../../common/services/user.service';
import { ApiService } from '../../../../../../shared-services/src/public-api';

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
  template: `
  <div class="thread-detail-container">
    <!-- Back Navigation -->
    <button mat-button class="back-button" (click)="handleBack()">
      <mat-icon>arrow_back</mat-icon>
      Back to Forum
    </button>

    <!-- Loading State -->
    <div *ngIf="loadingStates" class="loading-state">
      <mat-spinner diameter="50"></mat-spinner>
      <p>Loading thread...</p>
    </div>

    <!-- Error State -->
    <div *ngIf="error && !loadingStates" class="error-state">
      <mat-icon color="warn">error_outline</mat-icon>
      <p>{{ error }}</p>
      <button mat-raised-button color="primary" (click)="loadThreadData()">
        Retry
      </button>
    </div>

    <!-- Thread Content -->
    @if (thread && !loadingStates) {
    <ng-container>
      <mat-card class="thread-card">
        <mat-card-header>
          <img mat-card-avatar 
               [src]="thread.author.avatar || 'img/avatar.png'" 
               [alt]="thread.author.displayName">
          <mat-card-title>{{ thread.title }}</mat-card-title>
          <mat-card-subtitle>
            <span class="author-info">
              <span>{{thread.author.displayName | titlecase}} - <small>@{{thread.author.username}}</small></span>
            </span>
            <span class="spacer"></span>
            <span class="time">{{ timeAgo(thread.createdAt) }}</span>
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Media Display -->
           @if (thread.media) {
            <div class="thread-media">
              <img *ngIf="thread.media.type === 'image'" 
                  [src]="thread.media.url" 
                  [alt]="thread.media.originalName"
                  class="media-content">
              <video *ngIf="thread.media.type === 'video'" 
                    controls 
                    class="media-content">
                <source [src]="thread.media.url">
                <!-- <source [src]="thread.media.url" [type]="getMediaType(thread.media)"> -->
              </video>
              <audio *ngIf="thread.media.type === 'audio'" 
                    controls 
                    class="media-content">
                <source [src]=" thread.media.url">
                <!-- <source [src]=" thread.media.url" [type]="getMediaType(thread.media)"> -->
              </audio>
            </div>
           }

          <div class="thread-content" [innerHTML]="thread.content | sanitizeHtml"></div>
          
          <mat-chip-listbox class="thread-tags">
            <mat-chip *ngFor="let tag of thread.tags" 
                     color="primary">
              {{ tag }}
            </mat-chip>
          </mat-chip-listbox>
        </mat-card-content>

        <mat-card-actions class="thread-actions">
          <button mat-button 
                  [color]="thread.isLiked ? 'accent' : 'primary'"
                  (click)="toggleLikeThread()"
                  aria-label="Like thread"
                  [attr.aria-pressed]="thread.isLiked">
            <mat-icon>thumb_up</mat-icon>
            {{ thread.likeCount }}
          </button>
          <button mat-button color="primary" disabled>
            <mat-icon>comment</mat-icon>
            {{ thread.commentCount }}
          </button>
          <button mat-button color="primary" disabled>
            <mat-icon>visibility</mat-icon>
            {{ thread.viewCount }}
          </button>
        </mat-card-actions>
        
      </mat-card>

      <!-- Comment Section -->
      <section class="comment-section" aria-labelledby="comments-heading">
        <h3 id="comments-heading">Comments ({{ thread.commentCount }})</h3>

        <!-- Comment Form -->
        <form [formGroup]="commentForm" class="comment-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Add your comment</mat-label>
            <textarea matInput 
                    formControlName="content"
                    rows="4"
                    aria-label="Comment text area"
                    [attr.maxlength]="2000"></textarea>
            <mat-hint align="end">{{ remainingChars }} characters remaining</mat-hint>
          </mat-form-field>
          <button mat-raised-button 
                  color="primary"
                  (click)="addComment()"
                  [disabled]="commentForm.invalid || isSubmitting || !user()"
                  aria-label="Post comment">
            <span *ngIf="!isSubmitting">Post Comment</span>
            <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
          </button>
        </form>

        <!-- Comments Loading -->
        <div *ngIf="loadingStates" class="loading-comments">
          <mat-spinner diameter="40"></mat-spinner>
        </div>

        <!-- Comments List -->
        <div class="comments-list">
          <app-comment *ngFor="let comment of comments; trackBy: trackByCommentId"
            [comment]="comment"
            [threadId]="thread._id"
            [isAuthor]="isCommentAuthor(comment)"
            (likeComment)="toggleLikeComment($event)"
            (commentDeleted)="onCommentDeleted($event)">
          </app-comment>

          <!-- Empty State -->
           @if (comments.length === 0) {
          <div class="no-comments">
            <mat-icon>forum</mat-icon>
            <p>No comments yet. Be the first to comment!</p>
          </div>
           }
        </div>
      </section>
    </ng-container>
    }
  </div>
  `,
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
   // this.loadCurrentUser();
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

  // private loadCurrentUser(): void {
  //   this.userService.getCurrentUser$.pipe(
  //     takeUntil(this.destroy$)
  //   ).subscribe(user => {
  //     this.currentUser = user;
  //     this.cd.markForCheck();
  //   });
  // }

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
}