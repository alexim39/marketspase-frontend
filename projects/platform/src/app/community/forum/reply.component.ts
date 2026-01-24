// reply.component.ts
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { timeAgo as timeAgoUtil, } from '../../common/utils/time.util';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { UserService } from '../../common/services/user.service';
import { ForumService } from './forum.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogComponent } from './confirmationDialog.component';

@Component({
  selector: 'app-reply',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="reply">
      <div class="reply-main">
        <img class="reply-avatar" [src]="reply.author.avatar" [alt]="reply.author.name">
        
        <div class="reply-content">
          <div class="reply-header">
            <span class="reply-author">{{reply.author.name | titlecase}}</span>
            <span *ngIf="reply.author.isVerified" class="verified-badge">
              <mat-icon>verified</mat-icon>
            </span>
            <span class="reply-time">{{timeAgo(reply.createdAt)}}</span>

             <!-- Delete button - only shown if user is the owner -->
            <button *ngIf="isReplyOwner()" 
                    mat-icon-button 
                    color="warn" 
                    (click)="onDeleteReply($event)"
                    class="delete-button"
                    matTooltip="Delete reply">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
          
          <div class="reply-text">{{reply.content}}</div>
          
          <div class="reply-actions">
            <button mat-button (click)="toggleLike()">
              <mat-icon [class.accent]="reply.isLiked">thumb_up</mat-icon>
              {{reply.likeCount}}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./reply.component.scss']
})
export class ReplyComponent implements OnInit, OnDestroy {
  @Input() reply: any;
  @Output() replyDeleted = new EventEmitter<string>(); 

  subscriptions: Subscription[] = [];
  //currentUser: UserInterface | null = null;

  // Cleanup
  private destroy$ = new Subject<void>();

  private forumService = inject(ForumService);
  private cd = inject(ChangeDetectorRef);

  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private userService = inject(UserService);
  public user = this.userService.user;

  ngOnInit() {
    //this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // private loadCurrentUser(): void {
  //     this.subscriptions.push(
  //     this.userService.getCurrentUser$.subscribe({
  //       next: (user) => {
  //         this.currentUser = user;
  //         //console.log('current user ',this.user)
  //       }
  //     })
  //   )
  // }

  // Check if current user is the owner of the reply
  isReplyOwner(): boolean {
    return this.user()?._id === this.reply.author._id;
  }

   // Handle reply deletion
  onDeleteReply(event: Event) {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Reply',
        message: 'Are you sure you want to delete this reply?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteReply();
      }
    });
  }

  // Delete reply implementation
  private deleteReply() {
    if (!this.user()) return;

    this.forumService.deleteReply(this.reply._id, this.user()?._id ?? '').subscribe({
      next: () => {
        // Emit to parent component that reply was deleted
        this.replyDeleted.emit(this.reply._id);
      },
      error: (error) => {
        console.error('Error deleting reply:', error);
        this.snackBar.open('Failed to delete reply. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }
  
 toggleLike() {
    if (!this.user()) return;

    // Optimistic UI update
    const wasLiked = this.reply.isLiked;
    this.reply.isLiked = !wasLiked;
    this.reply.likeCount += this.reply.isLiked ? 1 : -1;
    // Optionally, trigger backend update here or emit an event to parent

    this.forumService.toggleLikeReply(this.reply._id, this.user()?._id ?? '').pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (response) => {
            if (response) {
              //this.updateCommentInList(updatedComment);
              this.cd.markForCheck();
            }
          },
          error: (err) => {
            //this.showError('Failed to update like');
          }
        });

  }
  
  timeAgo(date: string | Date): string {
    return timeAgoUtil(date);
  }
}