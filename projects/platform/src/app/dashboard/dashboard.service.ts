import { inject, Injectable } from '@angular/core';
import { Observable, } from 'rxjs'; // Import BehaviorSubject and of for reactive state
import { ApiService } from '../../../../shared-services/src/public-api';
import { HttpParams } from '@angular/common/http';

export interface TestimonialInterface {
  name: string;
  location: string;
  message: string;
  avatar: string;
  rating: number;
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
    return this.apiService.post<any>(`user/switch-user`, roleObject, undefined, true);
  }

  /**
   * Get the form data to the backend.
   * @returns An observable of the submitted form data.
  */
  getRandomTestimonials(): Observable<any> {
    return this.apiService.get<any>(`settings/testimonial/dashboard`, undefined, undefined, true);
  }


  getUsersOnlineCount(userId: string): Observable<{count: number, success: string}> {
    const params = new HttpParams().set('userId', userId);
    return this.apiService.get(`dashboard/stats/online-count`, params, undefined, true);
  }

}
