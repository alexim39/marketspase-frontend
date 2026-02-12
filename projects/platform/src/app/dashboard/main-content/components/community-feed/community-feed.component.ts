// community-feed.component.ts
import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface CommunityPost {
  id: string;
  author: string;
  role: string;
  avatar?: string;
  content: string;
  type: 'earnings' | 'campaign' | 'question' | 'tip';
  earnings?: number;
  campaignName?: string;
  budget?: number;
  time: string;
  likes: number;
  comments: number;
  badge?: 'top-promoter' | 'verified' | 'rising-star';
}

@Component({
  selector: 'community-feed',
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule
  ],
  templateUrl: './community-feed.component.html',
  styleUrls: ['./community-feed.component.scss']
})
export class CommunityFeedComponent {
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  posts = input<CommunityPost[]>([]);
  likedPosts = input<Set<string>>(new Set());
  savedPosts = input<Set<string>>(new Set());

  createPost = output<void>();
  viewAll = output<void>();
  like = output<CommunityPost>();
  save = output<string>();
  comment = output<string>();
  share = output<CommunityPost>();
  postMenu = output<string>();

  isLiked(postId: string): boolean {
    return this.likedPosts().has(postId);
  }

  isSaved(postId: string): boolean {
    return this.savedPosts().has(postId);
  }

  onLike(post: CommunityPost): void {
    this.like.emit(post);
  }

  onSave(postId: string): void {
    this.save.emit(postId);
  }

  onComment(postId: string): void {
    this.comment.emit(postId);
  }

  onShare(post: CommunityPost): void {
    if (navigator.share) {
      navigator.share({
        title: `${post.author} on MarketSpase`,
        text: post.content,
        url: `${window.location.origin}/dashboard/community/${post.id}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/dashboard/community/${post.id}`);
      this.snackBar.open('Link copied to clipboard!', 'OK', { duration: 2000 });
    }
    this.share.emit(post);
  }

  onPostMenu(postId: string): void {
    this.postMenu.emit(postId);
  }
}