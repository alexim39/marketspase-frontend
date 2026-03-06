import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { FeedPost } from '../../community/feeds/feed.service';
import { ApiService } from '../../../../../shared-services/src/public-api';

export interface ProfileUser {
  _id: string;
  uid: string;
  username: string;
  displayName: string;
  avatar: string;
  personalInfo?: {
    biography?: string;
    address?: {
      city?: string;
      country?: string;
    };
    createdAt?: Date;
  };
  role: 'marketer' | 'promoter' | 'admin';
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: Date;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  totalLikes: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
}

export interface FollowUser {
  _id: string;
  displayName: string;
  username: string;
  avatar?: string;
}

export interface SuggestedUser {
  _id: string;
  displayName: string;
  username: string;
  avatar?: string;
  isFollowing?: boolean; // optional
}

export interface PaginatedResponse<T> {
  //[key: string]: T[]; // 'followers' or 'following' or 'posts'
  total: number;
  page: number;
  totalPages: number;
  posts?: T[] | undefined; // for posts
  followers?: T[]; // for followers
  following?: T[]; // for following
}

@Injectable()
export class ProfileService {
  private apiService: ApiService = inject(ApiService);
  private baseUrl = 'profile';

  // New signals
  suggestedUsers = signal<SuggestedUser[]>([]);
  loadingSuggested = signal(false);

  getProfile(userId: string, currentUserId: string | null): Observable<ProfileUser> {
    const url = currentUserId 
      ? `${this.baseUrl}/${userId}/profile?currentUserId=${currentUserId}` 
      : `${this.baseUrl}/${userId}/profile`;
    return this.apiService.get<ProfileUser>(url);
  }

  getUserPosts(userId: string, page: number = 1, limit: number = 10, currentUserId: string | null = null): Observable<PaginatedResponse<FeedPost>> {
    let url = `${this.baseUrl}/${userId}/posts?page=${page}&limit=${limit}`;
    if (currentUserId) {
      url += `&currentUserId=${currentUserId}`;
    }
    return this.apiService.get<PaginatedResponse<FeedPost>>(url);
  }

  getFollowers(userId: string, page: number = 1, limit: number = 20, currentUserId?: string): Observable<PaginatedResponse<FollowUser>> {
    let url = `${this.baseUrl}/${userId}/followers?page=${page}&limit=${limit}`;
    if (currentUserId) {
      url += `&currentUserId=${currentUserId}`;
    }
    return this.apiService.get<PaginatedResponse<FollowUser>>(url);
  }

  getFollowing(userId: string, page: number = 1, limit: number = 20): Observable<PaginatedResponse<FollowUser>> {
    return this.apiService.get<PaginatedResponse<FollowUser>>(
      `${this.baseUrl}/${userId}/following?page=${page}&limit=${limit}`
    );
  }

  toggleFollow(userId: string, currentUserId: string | null): Observable<{ followed: boolean }> {
    return this.apiService.post<{ followed: boolean }>(`${this.baseUrl}/${userId}/follow`, { currentUserId });
  }

  fetchSuggestedUsers(userId: string, limit = 5): Observable<SuggestedUser[]> {
    this.loadingSuggested.set(true);
    return this.apiService.get<SuggestedUser[]>(
      `${this.baseUrl}/suggested?userId=${userId}&limit=${limit}`
    ).pipe(
      tap({
        next: (users) => {
          this.suggestedUsers.set(users);
          this.loadingSuggested.set(false);
        },
        error: () => this.loadingSuggested.set(false)
      })
    );
  }
  
}