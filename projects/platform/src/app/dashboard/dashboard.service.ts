import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '@shared/services';
import { HttpParams } from '@angular/common/http';

export interface TestimonialInterface {
  name: string;
  location: string;
  message: string;
  avatar: string;
  rating: number;
}

export interface DashboardLiveActivity {
  id: string;
  type: 'post' | 'forum' | 'campaign' | 'product' | string;
  author: string;
  authorId: string;
  avatar?: string;
  role?: string;
  title?: string;
  message: string;
  createdAt: string;
  actionUrl?: string;
}

export interface DashboardLiveActivityPayload {
  activities: DashboardLiveActivity[];
  summary: {
    feedPosts24h: number;
    forumThreads24h: number;
    campaigns24h: number;
    products24h: number;
    total24h: number;
  };
  refreshedAt: string;
}

@Injectable()
export class DashboardService {
  private apiService: ApiService = inject(ApiService);
  

  /**
   * Submits the user data to the backend API.
   * @post roleObject The user data to be submitted.
   * @returns An Observable that emits the API response or an error.
   */
  switchUser(roleObject: {role: string, userId: string | undefined}): Observable<any> {
    return this.apiService.post<any>(`api/v1/user/switch-user`, { role: roleObject.role }, undefined, true);
  }

  /**
   * Get the form data to the backend.
   * @returns An observable of the submitted form data.
  */
  getRandomTestimonials(): Observable<any> {
    return this.apiService.get<any>(`api/v1/settings/testimonial/dashboard`, undefined, undefined, true);
  }


  getUsersOnlineCount(userId: string): Observable<{count: number, success: string}> {
    const params = new HttpParams().set('userId', userId);
    return this.apiService.get(`api/v1/dashboard/stats/online-count`, params, undefined, true);
  }

  getLiveActivityFeed(limit: number = 12): Observable<{ success: boolean; data: DashboardLiveActivityPayload }> {
    const params = new HttpParams().set('limit', String(limit));
    return this.apiService.get<{ success: boolean; data: DashboardLiveActivityPayload }>(
      'api/v1/dashboard/stats/live-activity',
      params,
      undefined,
      true
    );
  }

}
