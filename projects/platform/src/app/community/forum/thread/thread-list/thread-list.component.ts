import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
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
    MatProgressSpinnerModule
  ],
  templateUrl: './thread-list.component.html',
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

  // Add inside the class
  isEditing = false;
  editTitleControl = new FormControl('', Validators.required);
  editContentControl = new FormControl('', Validators.required);
  editTagsControl = new FormControl(''); // comma‑separated string
  isUpdating = false;
  threadInEdit: Thread | null = null;

  // Enable edit mode
  onEditThread(thread: Thread, event: Event) {
    event.stopPropagation();
    this.threadInEdit = thread; // store the thread being edited (if needed elsewhere)
    this.isEditing = true;
    
    // Populate form controls
    this.editTitleControl.setValue(thread.title);
    this.editContentControl.setValue(thread.content);
    this.editTagsControl.setValue(thread.tags.join(', '));

    // Wait for the DOM to update with the edit form, then scroll to it
    setTimeout(() => {
      const editElement = document.getElementById('edit');
      if (editElement) {
        editElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100); // small delay to ensure rendering
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  isThreadOwner(thread: Thread): boolean {
    if (!this.user()?._id) return false;
    return thread.author._id === this.user()?._id;
  }

  /* getMediaType(media: Thread['media']): string {
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
  } */

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

  // Save changes
  saveEdit() {
    if (this.editTitleControl.invalid || this.editContentControl.invalid || this.isUpdating || !this.user()) return;

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
    ).subscribe({
      next: (updatedThread) => {
        // Update the local thread object
        this.threadInEdit = updatedThread;
        this.isEditing = false;
        this.isUpdating = false;
        this.cd.detectChanges();
        this.snackBar.open('Thread updated successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error updating thread:', error);
        this.isUpdating = false;
        this.cd.detectChanges();
        this.snackBar.open('Failed to update thread. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }

  // Cancel editing
  cancelEdit() {
    this.isEditing = false;
    this.editTitleControl.reset();
    this.editContentControl.reset();
    this.editTagsControl.reset();
  }

}