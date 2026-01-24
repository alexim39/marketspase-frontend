import { Component, Input, Output, EventEmitter, OnInit, inject, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Comment, ForumService, Reply } from '../forum.service';
import { timeAgo as timeAgoUtil, } from '../../../common/utils/time.util';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '../../../common/services/user.service';
import { Subscription } from 'rxjs';
import { ReplyComponent } from '../reply.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from '../confirmationDialog.component';

@Component({
selector: 'app-comment',
providers: [ForumService],
imports: [
  MatIconModule, 
  CommonModule, 
  MatInputModule, 
  MatButtonModule, 
  MatFormFieldModule, 
  MatProgressBarModule, 
  MatProgressSpinnerModule, 
  ReactiveFormsModule,
  ReplyComponent
],
template: `
<div class="comment">
  <div class="comment-main">
    <img class="comment-avatar" [src]="comment.author.avatar" [alt]="comment.author.displayName || 'User Avatar'">
    
    <div class="comment-content">
      <div class="comment-header">
        <span class="comment-author"> 
          <span class="time">{{timeAgo(comment.createdAt)}} </span>
        </span>
       <!--  <span *ngIf="comment.author.isVerified" class="verified-badge" matTooltip="Verified User">
          <mat-icon>verified</mat-icon>
        </span> -->
        <span class="comment-time">{{comment.author.displayName | titlecase}}</span>

         <!-- Delete button - only shown if user is the owner -->
            <button *ngIf="isCommentOwner()" 
                    mat-icon-button 
                    color="warn" 
                    (click)="onDeleteComment($event)"
                    class="delete-button"
                    matTooltip="Delete comment">
              <mat-icon>delete</mat-icon>
            </button>
      </div>
      
      <div class="comment-text">{{comment.content}}</div>
      
      <div class="comment-actions">
        <button mat-raised-button 
                (click)="toggleLike()" 
                [ngClass]="comment.isLiked ? 'mat-accent' : 'mat-primary'">
          <mat-icon>thumb_up</mat-icon>
          {{comment.likeCount}}
        </button>
        <button mat-button (click)="toggleReply()">
          <mat-icon>reply</mat-icon>
          Reply
        </button>
        <button *ngIf="comment.replies && comment.replies.length > 0" mat-button (click)="toggleReplies()">
          <mat-icon>{{showReplies ? 'expand_less' : 'expand_more'}}</mat-icon>
          {{comment.replies.length}} {{comment.replies.length === 1 ? 'reply' : 'replies'}}
        </button>
      </div>
      
      <div class="comment-reply-form" *ngIf="isReplying">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Your reply</mat-label>
          <textarea matInput [formControl]="replyControl" rows="2"></textarea>
        </mat-form-field>
        <div class="reply-buttons">
          <button mat-button (click)="toggleReply()">Cancel</button>
          <button mat-raised-button color="primary" 
                  (click)="addReply()"
                  [disabled]="replyControl.invalid || isSubmitting || !user()">
            <span *ngIf="!isSubmitting">Post Reply</span>
            <mat-spinner *ngIf="isSubmitting" diameter="20"/>
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- In comment.component.html -->
  <div class="comment-replies" *ngIf="showReplies">
    <app-reply 
      *ngFor="let reply of replies"
      [reply]="reply"
      (replyDeleted)="onReplyDeleted($event)"
    />
  </div>

`,
styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit, OnDestroy {
  @Input() comment!: Comment;
  @Input() threadId!: string;
  @Input() isAuthor!: boolean;
  //@Input() deleteComment!: string;
  @Output() likeComment = new EventEmitter<string>();
  @Output() commentDeleted = new EventEmitter<string>(); // New output for deletion

 // currentUser: UserInterface | null = null;
  private forumService = inject(ForumService);
  private cd = inject(ChangeDetectorRef);
  subscriptions: Subscription[] = [];
  private snackBar = inject(MatSnackBar);
  
  replyControl = new FormControl('', Validators.required);
  isReplying = false;
  isSubmitting = false;
  showReplies = false;
  destroy$: any;

  replies: Reply[] = [];
  isLoadingReplies = false;

  private dialog = inject(MatDialog);

  private userService = inject(UserService);
  public user = this.userService.user;

  ngOnInit() {
    //console.log('sent comments ',this.comment)
    if (!this.comment.replies) {
      this.comment.replies = [];
    }
    this.replies = this.comment.replies; // Initialize replies from comment
  }

   ngOnDestroy(): void {
     this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }


    // Check if current user is the owner of the comment
    isCommentOwner(): boolean {
      return this.user()?._id === this.comment.author._id;
    }

    // Handle comment deletion
    onDeleteComment(event: Event) {
      event.stopPropagation();
      
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Delete Comment',
          message: 'Are you sure you want to delete this comment?',
          confirmText: 'Delete',
          cancelText: 'Cancel'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.deleteComment();
        }
      });
    }

    // Delete comment implementation
  private deleteComment() {
    if (!this.user()) return;

    const userId = this.user()?._id;
    if (!userId) return;

    this.subscriptions.push(
      this.forumService.deleteComment(this.comment._id, userId).subscribe({
        next: () => {
          // Emit to parent component that comment was deleted
          this.commentDeleted.emit(this.comment._id);
          // The parent component should handle removing the comment from the list
        },
        error: (error) => {
          console.error('Error deleting comment:', error);
          this.snackBar.open('Failed to delete comment. Please try again.', 'Close', { duration: 3000 });
        }
      })
    );
  }


  toggleReply() {
    this.isReplying = !this.isReplying;
    if (!this.isReplying) {
      this.replyControl.reset();
    }
  }


  // comment.component.ts
 addReply() {
  if (this.replyControl.invalid || this.isSubmitting || !this.user()) return;

  this.isSubmitting = true;
  this.cd.detectChanges();

  this.forumService.addCommentReply(
    this.replyControl.value ?? '',
    this.user()?._id ?? '',
    this.comment._id
  ).subscribe({
    next: (response) => {
      //console.log('New reply added:', response.data);
      const sentReply: Reply = {
        _id: response.data._id,
        content: response.data.content,
        createdAt: response.data.createdAt,
        author: {
          avatar: response.data.author.avatar,
          _id: response.data.author._id,
          displayName: response.data.author.displayName,
          username: response.data.author.username,
        },
        isDeleted: response.data.isDeleted,
        isLiked: response.data.isLiked,
        likeCount: response.data.likeCount,
        parentComment: response.data.parentComment,
        thread: response.data.thread,
        updatedAt: response.data.updatedAt
      };
      this.replies.unshift(sentReply);
      this.comment.replyCount = (this.comment.replyCount || 0) + 1;
      this.replyControl.reset();
      this.isReplying = false;
      this.isSubmitting = false;
      this.showReplies = true;
      this.cd.detectChanges();
    },
    error: (error) => {
      console.error('Error adding reply:', error);
      this.isSubmitting = false;
      this.cd.detectChanges();
    }
  });
}

  toggleLike() {
    if (!this.user()) return;

    //this.likeComment.emit(this.comment._id);

    // Optimistic UI update
    const wasLiked = this.comment.isLiked;
    this.comment.isLiked = !wasLiked;
    this.comment.likeCount += this.comment.isLiked ? 1 : -1;
    this.cd.markForCheck();

    // Emit to parent to handle backend update and revert if needed
    this.likeComment.emit(this.comment._id);

    // if (!this.thread || !this.currentUser) return;

    // this.forumService.toggleLikeComment(commentId, this.currentUser._id).pipe(
    //   takeUntil(this.destroy$)
    // ).subscribe({
    //   next: (updatedComment) => {
    //     if (updatedComment) {
    //       this.updateCommentInList(updatedComment);
    //       this.cd.markForCheck();
    //     }
    //   },
    //   error: (err) => {
    //     this.showError('Failed to update like');
    //   }
    // });
  }

  toggleReplies() {
    this.showReplies = !this.showReplies;
  }

  timeAgo(date: string | Date): string {
    return timeAgoUtil(date);
  }

  onReplyDeleted(replyId: any) {
    this.replies = this.replies.filter(r => r._id !== replyId);
    //this.comment.replyCount = (this.comment.replyCount || 0) - 1;
    this.snackBar.open('Reply deleted successfully', 'Close', { duration: 3000 });
    //this.cd.detectChanges();
  }
}