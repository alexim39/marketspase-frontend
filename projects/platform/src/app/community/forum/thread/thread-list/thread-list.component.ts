import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { timeAgo as timeAgoUtil } from '../../../../common/utils/time.util';
import { CommonModule } from '@angular/common';
import { ForumService, Thread } from '../../forum.service';
import { MatButtonModule } from '@angular/material/button';
import { UserService } from '../../../../common/services/user.service';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../../../../../shared-services/src/public-api';
import { ConfirmDialogComponent } from '../../confirmationDialog.component';
import { TruncatePipe } from '../../../../store/shared';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

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
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './thread-list.component.html',
  styleUrls: ['./thread-list.component.scss']
})
export class ThreadListComponent implements OnInit {
  @Input() threads: Thread[] = [];
  @Output() threadClicked = new EventEmitter<string>();

  public apiService = inject(ApiService);
  private forumService = inject(ForumService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private cd = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  
  subscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();

  private userService = inject(UserService);
  public user = this.userService.user;

  // Edit state
  isEditing = false;
  editTitleControl = new FormControl('', Validators.required);
  editContentControl = new FormControl('', Validators.required);
  editTagsControl = new FormControl('');
  isUpdating = false;
  threadInEdit: Thread | null = null;

  // Pin permission state
  canPinThreads = false;
  isPinning = false;

  ngOnInit(): void {
    this.checkPinPermissions();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if current user has permission to pin threads
   */
  private checkPinPermissions(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.canPinThreads = currentUser.type === 'admin' || currentUser.type === 'moderator';
    }
  }

  /**
   * Check if current user is the thread owner
   */
  isThreadOwner(thread: Thread): boolean {
    if (!this.user()?._id) return false;
    return thread.author._id === this.user()?._id;
  }

  /**
   * Pin a thread (Admin/Moderator only)
   */
  onPinThread(thread: Thread, event: Event): void {
    event.stopPropagation();
    
    if (!this.canPinThreads || this.isPinning) return;

    const userId = this.user()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in to pin threads', 'Close', { duration: 3000 });
      return;
    }

    this.isPinning = true;

    this.forumService.pinThread(thread._id, userId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Update the thread in the local array
        const threadIndex = this.threads.findIndex(t => t._id === thread._id);
        if (threadIndex !== -1) {
          this.threads[threadIndex] = {
            ...this.threads[threadIndex],
            isPinned: true,
            pinnedAt: response.data?.pinnedAt || new Date().toISOString()
          };
        }
        
        this.isPinning = false;
        this.cd.detectChanges();
        this.snackBar.open(response.message || 'Thread pinned successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.isPinning = false;
        this.cd.detectChanges();
        this.snackBar.open(
          error.error?.message || 'Failed to pin thread. Please try again.', 
          'Close', 
          { duration: 3000 }
        );
      }
    });
  }

  /**
   * Unpin a thread (Admin/Moderator only)
   */
  onUnpinThread(thread: Thread, event: Event): void {
    event.stopPropagation();
    
    if (!this.canPinThreads || this.isPinning) return;

    const userId = this.user()?._id;
    if (!userId) {
      this.snackBar.open('You must be logged in to unpin threads', 'Close', { duration: 3000 });
      return;
    }

    this.isPinning = true;

    this.forumService.unpinThread(thread._id, userId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Update the thread in the local array
        const threadIndex = this.threads.findIndex(t => t._id === thread._id);
        if (threadIndex !== -1) {
          this.threads[threadIndex] = {
            ...this.threads[threadIndex],
            isPinned: false,
            pinnedAt: undefined
          };
        }
        
        this.isPinning = false;
        this.cd.detectChanges();
        this.snackBar.open(response.message || 'Thread unpinned successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.isPinning = false;
        this.cd.detectChanges();
        this.snackBar.open(
          error.error?.message || 'Failed to unpin thread. Please try again.', 
          'Close', 
          { duration: 3000 }
        );
      }
    });
  }

  /**
   * Toggle pin status (Admin/Moderator only)
   */
  onTogglePin(thread: Thread, event: Event): void {
    if (thread.isPinned) {
      this.onUnpinThread(thread, event);
    } else {
      this.onPinThread(thread, event);
    }
  }

  /**
   * Enable edit mode for a thread
   */
  onEditThread(thread: Thread, event: Event): void {
    event.stopPropagation();
    this.threadInEdit = thread;
    this.isEditing = true;
    
    // Populate form controls
    this.editTitleControl.setValue(thread.title);
    this.editContentControl.setValue(thread.content);
    this.editTagsControl.setValue(thread.tags?.join(', ') || '');

    // Scroll to edit form
    setTimeout(() => {
      const editElement = document.getElementById('edit');
      if (editElement) {
        editElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  /**
   * Delete a thread
   */
  onDeleteThread(threadId: string, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Thread',
        message: 'Are you sure you want to delete this thread? This action cannot be undone.',
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

  private deleteThread(threadId: string): void {
    if (!this.user()) return;
    
    this.forumService.deleteThread(threadId, this.user()?._id ?? '').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.threads = this.threads.filter(t => t._id !== threadId);
        this.cd.detectChanges();
        this.snackBar.open(response.message || 'Thread deleted successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Failed to delete thread. Please try again.', 
          'Close', 
          { duration: 3000 }
        );
      }
    });
  }

  /**
   * Navigate to thread detail
   */
  openThread(threadId: string): void {
    if (!threadId) return;
    this.threadClicked.emit(threadId);
  }

  /**
   * Save edited thread
   */
  saveEdit(): void {
    if (this.editTitleControl.invalid || this.editContentControl.invalid || this.isUpdating || !this.user()) {
      return;
    }

    this.isUpdating = true;
    const userId = this.user()!._id;
    const tags = this.editTagsControl.value
      ? this.editTagsControl.value.split(',').map(t => t.trim()).filter(t => t)
      : [];

    this.forumService.updateThread(
      this.threadInEdit!._id,
      {
        title: this.editTitleControl.value!,
        content: this.editContentControl.value!,
        tags: tags
      },
      userId
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedThread) => {
        // Update the thread in the local array
        const threadIndex = this.threads.findIndex(t => t._id === this.threadInEdit!._id);
        if (threadIndex !== -1) {
          this.threads[threadIndex] = {
            ...this.threads[threadIndex],
            ...updatedThread
          };
        }
        
        this.threadInEdit = null;
        this.isEditing = false;
        this.isUpdating = false;
        this.cd.detectChanges();
        this.snackBar.open('Thread updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating thread:', error);
        this.isUpdating = false;
        this.cd.detectChanges();
        this.snackBar.open(
          error.error?.message || 'Failed to update thread. Please try again.', 
          'Close', 
          { duration: 3000 }
        );
      }
    });
  }

  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.isEditing = false;
    this.threadInEdit = null;
    this.editTitleControl.reset();
    this.editContentControl.reset();
    this.editTagsControl.reset();
  }

  /**
   * Format time ago
   */
  timeAgo(date: string | Date): string {
    return timeAgoUtil(date);
  }
}