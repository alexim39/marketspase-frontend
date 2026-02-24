import { Component, inject, OnInit, signal } from '@angular/core';
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
import { FeedService, FeedPost } from '../feed.service';
import { DatePipe } from '@angular/common';

export interface CommentDialogData {
  postId: string;
}

interface Comment {
  _id?: string;
  user: {
    _id: string;
    displayName: string;
    avatar: string;
    username: string;
  };
  content: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
  createdAt: string;
  time: string;
}

@Component({
  selector: 'app-comment-dialog',
  standalone: true,
  providers: [FeedService],
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
  styleUrls: ['./comment-dialog.component.scss']
})
export class CommentDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CommentDialogComponent>);
  private feedService = inject(FeedService);
  private snackBar = inject(MatSnackBar);
  private data: CommentDialogData = inject(MAT_DIALOG_DATA);

  comments = signal<Comment[]>([]);
  loading = signal(true);
  submitting = signal(false);
  newComment = '';
  replyText = '';
  replyingTo = signal<Comment | null>(null);
  currentUserAvatar = ''; // This should come from auth service

  ngOnInit(): void {
    this.loadComments();
    // Get current user avatar from auth service
    // this.currentUserAvatar = this.authService.currentUser()?.avatar;
  }

  private loadComments(): void {
    // In a real app, you'd fetch comments from an API
    // For demo, we'll simulate loading
    setTimeout(() => {
      // Mock data - replace with actual API call
      this.comments.set([
        {
          _id: '1',
          user: {
            _id: 'user1',
            displayName: 'John Doe',
            username: 'johndoe',
            avatar: 'img/avatar.png'
          },
          content: 'This is really helpful! Thanks for sharing.',
          likes: 5,
          isLiked: false,
          createdAt: new Date().toISOString(),
          time: '2h ago',
          replies: [
            {
              _id: '2',
              user: {
                _id: 'user2',
                displayName: 'Jane Smith',
                username: 'janesmith',
                avatar: 'img/avatar.png'
              },
              content: 'I agree, great insights!',
              likes: 2,
              isLiked: true,
              createdAt: new Date().toISOString(),
              time: '1h ago'
            }
          ]
        },
        {
          _id: '3',
          user: {
            _id: 'user3',
            displayName: 'Mike Johnson',
            username: 'mikej',
            avatar: 'img/avatar.png'
          },
          content: 'How did you achieve this? Would love to learn more about your strategy.',
          likes: 3,
          isLiked: false,
          createdAt: new Date().toISOString(),
          time: '3h ago'
        }
      ]);
      this.loading.set(false);
    }, 1000);
  }

  submitComment(): void {
    if (!this.newComment.trim() || this.submitting()) return;

    this.submitting.set(true);

    // Simulate API call
    setTimeout(() => {
      const newComment: Comment = {
        _id: Date.now().toString(),
        user: {
          _id: 'current-user',
          displayName: 'Current User',
          username: 'currentuser',
          avatar: this.currentUserAvatar || 'img/avatar.png'
        },
        content: this.newComment,
        likes: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
        time: 'Just now'
      };

      this.comments.update(comments => [newComment, ...comments]);
      this.newComment = '';
      this.submitting.set(false);

      this.snackBar.open('Comment added', 'OK', { duration: 2000 });
    }, 500);
  }

  submitReply(comment: Comment): void {
    if (!this.replyText.trim() || this.submitting()) return;

    this.submitting.set(true);

    // Simulate API call
    setTimeout(() => {
      const newReply: Comment = {
        _id: Date.now().toString(),
        user: {
          _id: 'current-user',
          displayName: 'Current User',
          username: 'currentuser',
          avatar: this.currentUserAvatar || 'img/avatar.png'
        },
        content: this.replyText,
        likes: 0,
        isLiked: false,
        createdAt: new Date().toISOString(),
        time: 'Just now'
      };

      this.comments.update(comments =>
        comments.map(c => {
          if (c._id === comment._id) {
            return {
              ...c,
              replies: [...(c.replies || []), newReply]
            };
          }
          return c;
        })
      );

      this.replyText = '';
      this.replyingTo.set(null);
      this.submitting.set(false);

      this.snackBar.open('Reply added', 'OK', { duration: 2000 });
    }, 500);
  }

  toggleCommentLike(comment: Comment): void {
    this.comments.update(comments =>
      comments.map(c => {
        if (c._id === comment._id) {
          return {
            ...c,
            isLiked: !c.isLiked,
            likes: c.isLiked ? c.likes - 1 : c.likes + 1
          };
        }
        return c;
      })
    );
  }

  toggleReplyLike(comment: Comment, reply: Comment): void {
    this.comments.update(comments =>
      comments.map(c => {
        if (c._id === comment._id && c.replies) {
          return {
            ...c,
            replies: c.replies.map(r => {
              if (r._id === reply._id) {
                return {
                  ...r,
                  isLiked: !r.isLiked,
                  likes: r.isLiked ? r.likes - 1 : r.likes + 1
                };
              }
              return r;
            })
          };
        }
        return c;
      })
    );
  }

  setReplyTo(comment: Comment): void {
    this.replyingTo.set(comment);
  }

  cancelReply(): void {
    this.replyingTo.set(null);
    this.replyText = '';
  }
}