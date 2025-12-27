import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TruncatePipe } from '../../common/pipes/truncate.pipe';
import { timeAgo as timeAgoUtil } from '../../common/utils/time.util';
import { CommonModule } from '@angular/common';
import { ForumService, Thread } from '../forum.service';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../common/services/user.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../../../shared-services/src/public-api';
import { ConfirmDialogComponent } from '../confirmationDialog.component';

@Component({
  selector: 'app-thread-list',
  providers: [ApiService],
  standalone: true,
  imports: [
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatChipsModule, 
    TruncatePipe, 
    CommonModule
  ],
  template: `
    <div class="thread-list">
      <div *ngFor="let thread of threads" class="thread-item">
        <mat-card (click)="openThread(thread._id)" class="thread-card">
          <mat-card-header>
            <img mat-card-avatar [src]="thread.author.avatar || 'assets/default-avatar.png'" [alt]="thread.author.displayName || 'User Avatar'">
            <mat-card-title>{{thread.title}}</mat-card-title>
            <mat-card-subtitle>
              <span>{{thread.author.displayName | titlecase}} - @{{thread.author.username}}</span>
              <span class="spacer"></span>
              <span>{{timeAgo(thread.createdAt) }}</span>
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <!-- Media Preview -->
            @if (thread.media) {
              <div class="media-preview">
                <img *ngIf="thread.media.type === 'image'" 
                    [src]="thread.media.url" 
                    [alt]="thread.media.originalName"
                    class="preview-image">
                @if (thread.media.type === 'video') {
                  <video controls class="preview-video">
                    <source [src]="thread.media.url">
                    <!-- <source [src]="thread.media.url" [type]="getMediaType(thread.media)"> -->
                  </video>
                }
                @if (thread.media.type === 'audio') {
                  <audio controls class="preview-audio">
                    <source [src]=" thread.media.url">
                    <!-- <source [src]=" thread.media.url" [type]="getMediaType(thread.media)"> -->
                  </audio>
                }
              </div>
            }

            <p class="thread-content">{{thread.content | truncate:150}}</p>
            
            <div class="thread-tags">
              <mat-chip-listbox>
                <mat-chip *ngFor="let tag of thread.tags" color="primary" selected>
                  {{tag}}
                </mat-chip>
              </mat-chip-listbox>
            </div>
          </mat-card-content>
          
          <mat-card-actions>
            <button mat-button class="like-btn">
              <mat-icon>thumb_up</mat-icon>
              {{thread.likeCount}}
            </button>
            <button mat-button class="comment-btn">
              <mat-icon>comment</mat-icon>
              {{thread.commentCount}}
            </button>
            <button mat-button class="view-btn">
              <mat-icon>visibility</mat-icon>
              {{thread.viewCount}}
            </button>
            @if (isThreadOwner(thread)) {
              <button 
                mat-button 
                color="warn" 
                (click)="onDeleteThread(thread._id, $event)"
                class="delete-button">
                <mat-icon>delete</mat-icon>
                Delete
              </button>
            }
          </mat-card-actions>
        </mat-card>
      </div>
      @if (threads.length === 0) {
        <div class="no-threads">
          <mat-icon>forum</mat-icon>
          <h3>No threads yet</h3>
          <p>Be the first to start a discussion!</p>
        </div>
      }
    </div>
  `,
  styleUrls: ['./thread-list.component.scss']
})
export class ThreadListComponent {
  @Input() threads: Thread[] = [];
  @Output() threadClicked = new EventEmitter<string>();

  public apiService = inject(ApiService);
  private forumService = inject(ForumService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  
  //currentUser: UserInterface | null = null;
  subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();

  private userService = inject(UserService);
  public user = this.userService.user;


  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }



  isThreadOwner(thread: Thread): boolean {
    if (!this.user()?._id) return false;
    return thread.author._id === this.user()?._id;
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

  onDeleteThread(threadId: string, event: Event) {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Thread',
        message: 'Are you sure you want to delete this thread?',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteThread(threadId);
      }
    });
  }

  private deleteThread(threadId: string) {
    if (!this.user()) return;
    
    this.forumService.deleteThread(threadId, this.user()?._id ?? '').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.threads = this.threads.filter(t => t._id !== threadId);
        this.cd.detectChanges();
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open('Failed to delete thread. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  openThread(threadId: string) {
    if (!threadId) return;
    this.threadClicked.emit(threadId); 

    // Keep navigation as backup if parent doesn't handle it
    //this.router.navigate(['/dashboard/forum/thread', threadId]);
  }

  timeAgo(date: string | Date): string {
    return timeAgoUtil(date);
  }
}