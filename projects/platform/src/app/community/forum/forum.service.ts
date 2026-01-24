import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../../shared-services/src/public-api';

// export interface Thread {
//   _id: string;
//   title: string;
//   content: string;
//   author: User;
//   createdAt: Date;
//   tags: string[];
//   likeCount: number;
//   commentCount: number;
//   viewCount: number;
//   isLiked?: boolean;
// }

// In your forum.service.ts or appropriate model file
export interface Thread {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    displayName: string;
    username: string;
    avatar?: string;
  };
  tags: string[];
  media?: {
    url: string;
    type: 'image' | 'video' | 'audio';
    filename: string;
    originalName: string;
    size: number;
  };
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  isLiked?: boolean;
}

export interface Comment {
  _id: string;
  content: string;
  author: User;
  createdAt: Date;
  likeCount: number;
   replies?: Reply[]; 
  isLiked?: boolean;
  replyCount?: number;
  isReply?: boolean;
}

export interface User {
  _id: string;
  displayName: string;
  username: string;
  avatar: string;
  isVerified?: boolean;
}

export interface Reply {
  _id: string;  
  content: string;
  createdAt: Date;
  author: User;
  isDeleted?: boolean;
  isLiked?: boolean;
  likeCount?: number;
  parentComment?: Comment;
  thread?: Thread;
  updatedAt?: Date;
  replyCount?: number;
}


@Injectable()
export class ForumService {
  constructor(private apiService: ApiService) {}

  // Thread Operations
  // This method creates a new thread in the forum
  // createThread(thread: { title: string; content: string; tags: string[], authorId: string }): Observable<Thread> {
  //   return this.apiService.post<Thread>('forum/threads/new', thread,  undefined, true);
  // }

  createThread(formData: FormData): Observable<Thread> {
    return this.apiService.post<Thread>('forum/threads/new', formData, undefined, true);
  }

  // Get all threads
  // This method fetches all threads from the forum
  getThreads(){;
    return this.apiService.get<any>('forum/threads', undefined, undefined, true);
  }

  // Get a perticular thread by ID
  getThreadById(id: string): Observable<any> {
    return this.apiService.get<any>(`forum/thread/${id}`, undefined, undefined, true);
  }

  // This method adds a new comment to a thread
  addComment(threadId: string, content: string, authorId: string, parentCommentId?: string): Observable<any> {
    return this.apiService.post<Comment>(`forum/thread/comment/new`, { content, threadId, authorId, parentCommentId }, undefined, true);
  }

  // This method adds a comment reply in a thread
  addCommentReply( content: string, authorId: string, commentId: string): Observable<any> {
    return this.apiService.post<Comment>(`forum/thread/comment/reply`, { content, commentId, authorId }, undefined, true);
  }

  // Method to like/disklike a thread
  toggleLikeThread(threadId: string, userId: string): Observable<any> {
    //console.log('Toggling like for thread:', threadId, 'by user:', userId);
    return this.apiService.put<any>(`forum/thread/like`, {threadId, userId}, undefined, true);
  }

  getThreadsByTag(tag: string): Observable<any> {
    return this.apiService.get<any>(`forum/threads/tags/${tag}`, undefined, undefined, true);
  }

  // Comment Operations
  toggleLikeComment(commentId: string, userId: string): Observable<Comment> {
    return this.apiService.post<Comment>(`forum/comments/like`, {commentId, userId}, undefined,  true);
  }

  toggleLikeReply(replyId: string, userId: string): Observable<Comment> {
    return this.apiService.post<Comment>(`forum/comments/reply/like`, {replyId, userId}, undefined,  true);
  }

  // Delete Thread by ID
  deleteThread(threadId: string, userId: string): Observable<any> {
    return this.apiService.delete<any>(`forum/thread/${threadId}/${userId}`, undefined, undefined, true);
  }

  // Delete a comment by ID
  deleteComment(commentId: string, userId: string): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(`forum/comment/${commentId}/${userId}`, undefined, undefined, true);
  }

  // Delete a reply by ID
  deleteReply(replyId: string, userId: string): Observable<{ success: boolean }> {
    return this.apiService.delete<{ success: boolean }>(`forum/reply/${replyId}/${userId}`, undefined, undefined, true);
  }
 
}